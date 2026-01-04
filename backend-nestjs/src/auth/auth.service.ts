import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private cfg: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ---------- 注册 & 登录 ----------
  async register(email: string, password: string, nickname: string) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ConflictException('Email already registered');

    const user = await this.users.createUser(email, password, nickname);
    const tokens = await this.issueTokens(user.id, user.email, user.nickname);
    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.email, user.nickname);
    return {
      user: { id: user.id, email: user.email, nickname: user.nickname },
      ...tokens,
    };
  }

  // ---------- 刷新 & 注销 ----------
  async refresh(refreshToken: string) {
    const payload = await this.verifyRefresh(refreshToken); // 校验签名/过期
    const rt = await this.findRefreshEntity(refreshToken);
    if (!rt || rt.revokedAt || rt.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token invalid');
    }
    // 轮换：吊销旧的 -> 颁发新的
    await this.revokeRefreshById(rt.id);
    const tokens = await this.issueTokens(
      payload.sub,
      payload.email,
      payload.nickname,
    );
    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const rt = await this.findRefreshEntity(refreshToken);
      if (rt && rt.userId === userId && !rt.revokedAt) {
        await this.revokeRefreshById(rt.id);
      }
    } else {
      // 全部注销：撤销该用户所有未撤销的 refresh
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { ok: true };
  }

  // ---------- 工具：签发访问 & 刷新 ----------
  private async issueTokens(id: string, email: string, nickname: string) {
    const access = await this.jwt.signAsync(
      { sub: id, email, nickname },
      {
        secret: this.cfg.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.cfg.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
      },
    );

    const refresh = await this.jwt.signAsync(
      { sub: id, email, nickname },
      {
        secret: this.cfg.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.cfg.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d',
      },
    );

    await this.persistRefreshToken(id, refresh);
    return { accessToken: access, refreshToken: refresh };
  }

  private async verifyRefresh(refreshToken: string) {
    try {
      return await this.jwt.verifyAsync(refreshToken, {
        secret: this.cfg.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private tokenHash(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async persistRefreshToken(userId: string, token: string) {
    const payload: any = await this.verifyRefresh(token);
    const expiresAt = new Date(payload.exp * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.tokenHash(token),
        expiresAt,
      },
    });
  }

  private async findRefreshEntity(token: string) {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash: this.tokenHash(token) },
    });
  }

  private async revokeRefreshById(id: string) {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
