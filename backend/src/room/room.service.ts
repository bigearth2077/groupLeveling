import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  createRoom(name: string) {
    return this.prisma.room.create({ data: { name } });
  }

  listRooms(page = 1, pageSize = 50) {
    return this.prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async ensureRoom(roomId: string) {
    const r = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!r) throw new NotFoundException('Room not found');
    return r;
  }

  /** 逻辑：只有“第一次加入”才在 DB 里持久化在线状态（leftAt=null）。 */
  async joinRoom(
    userId: string,
    roomId: string,
    status: 'learning' | 'rest' | 'idle' = 'idle',
  ) {
    await this.ensureRoom(roomId);
    const exists = await this.prisma.roomMember.findFirst({
      where: { userId, roomId, leftAt: null },
      select: { id: true },
    });
    if (exists) {
      return this.prisma.roomMember.update({
        where: { id: exists.id },
        data: { status },
      });
    }
    return this.prisma.roomMember.create({
      data: { userId, roomId, status, joinedAt: new Date() },
    });
  }

  /** 逻辑：只有“最后一次离开”才落 DB（leftAt 写入）。 */
  async leaveRoom(userId: string, roomId: string) {
    const m = await this.prisma.roomMember.findFirst({
      where: { userId, roomId, leftAt: null },
      orderBy: { joinedAt: 'desc' },
    });
    if (!m) return { ok: true, changed: 0 };
    await this.prisma.roomMember.update({
      where: { id: m.id },
      data: { leftAt: new Date() },
    });
    return { ok: true, changed: 1 };
  }

  async updateStatus(
    userId: string,
    roomId: string,
    status: 'learning' | 'rest' | 'idle',
  ) {
    const m = await this.prisma.roomMember.findFirst({
      where: { userId, roomId, leftAt: null },
    });
    if (!m) throw new BadRequestException('Not in room');
    await this.prisma.roomMember.update({
      where: { id: m.id },
      data: { status },
    });
    return { ok: true };
  }

  async listMembers(roomId: string) {
    await this.ensureRoom(roomId);
    const items = await this.prisma.roomMember.findMany({
      where: { roomId, leftAt: null },
      include: {
        user: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
    return {
      items: items.map((i) => ({
        userId: i.userId,
        nickname: i.user.nickname,
        avatarUrl: i.user.avatarUrl,
        status: i.status,
        joinedAt: i.joinedAt,
      })),
    };
  }
}
