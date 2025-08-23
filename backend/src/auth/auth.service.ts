import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(email: string, password: string, nickname: string) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ConflictException('Email already registered');
    const user = await this.users.createUser(email, password, nickname);
    const token = await this.sign(user.id, user.email, user.nickname);
    return { ...user, token };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = await this.sign(user.id, user.email, user.nickname);
    return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
  }

  private sign(id: string, email: string, nickname: string) {
    return this.jwt.signAsync({ sub: id, email, nickname });
  }
}
