import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(email: string, password: string, nickname: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { email, passwordHash, nickname },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        bio: true,
      },
    });
  }

  async getPublicProfile(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });
    return u;
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; avatarUrl?: string; bio?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        bio: true,
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { ok: true };
  }

  async searchUsers(query: string, page = 1, pageSize = 20) {
    if (!query?.trim()) return { items: [], total: 0, page, pageSize };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { nickname: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          avatarUrl: true,
          bio: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { nickname: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);
    return { items, total, page, pageSize };
  }

  async deleteMe(userId: string) {
    // 级联删除：RefreshToken onDelete: Cascade 已在 Prisma 里配置
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }
}
