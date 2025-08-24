import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendStatus, Prisma } from '@prisma/client';

@Injectable()
export class FriendService {
  constructor(private prisma: PrismaService) {}

  // 发送好友请求：若对方已向你发过 pending，则直接接受；若已是好友/重复请求则报错
  async createRequest(me: string, targetId: string) {
    if (me === targetId) throw new BadRequestException('Cannot add yourself');

    // 已有任意方向的关系？
    const existing = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId: me, friendId: targetId },
          { userId: targetId, friendId: me },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendStatus.accepted) {
        throw new BadRequestException('Already friends');
      }
      // 若对方已向我发起 pending，则我这次请求视为“同意”
      if (
        existing.userId === targetId &&
        existing.friendId === me &&
        existing.status === 'pending'
      ) {
        return this.prisma.friend.update({
          where: { id: existing.id },
          data: { status: 'accepted' },
        });
      }
      // 我已发过 pending
      if (existing.userId === me && existing.status === 'pending') {
        throw new BadRequestException('Request already sent');
      }
    }

    // 创建新 pending
    return this.prisma.friend.create({
      data: { userId: me, friendId: targetId, status: 'pending' },
    });
  }

  // 待处理请求（别人发给我）
  incomingRequests(me: string, page = 1, pageSize = 20) {
    return this.listRequests(
      { friendId: me, status: 'pending' },
      page,
      pageSize,
    );
  }

  // 我发出的 pending
  outgoingRequests(me: string, page = 1, pageSize = 20) {
    return this.listRequests({ userId: me, status: 'pending' }, page, pageSize);
  }

  private async listRequests(
    where: Prisma.FriendWhereInput,
    page: number,
    pageSize: number,
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.friend.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true, avatarUrl: true } },
          friend: { select: { id: true, nickname: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.friend.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  // 接受/拒绝请求：只能处理发给“我”的 pending
  async actOnRequest(
    me: string,
    requestId: string,
    action: 'accept' | 'reject',
  ) {
    const req = await this.prisma.friend.findUnique({
      where: { id: requestId },
    });
    if (!req || req.friendId !== me || req.status !== 'pending') {
      throw new NotFoundException('Request not found');
    }
    if (action === 'accept') {
      return this.prisma.friend.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      });
    } else {
      // 拒绝则删除记录（也可保留 status = rejected；本 schema 仅 pending/accepted）
      await this.prisma.friend.delete({ where: { id: requestId } });
      return { ok: true };
    }
  }

  // 朋友列表（已接受）
  async listFriends(me: string, page = 1, pageSize = 50) {
    const where: Prisma.FriendWhereInput = {
      status: 'accepted',
      OR: [{ userId: me }, { friendId: me }],
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.friend.findMany({
        where,
        include: {
          user: {
            select: { id: true, nickname: true, avatarUrl: true, bio: true },
          },
          friend: {
            select: { id: true, nickname: true, avatarUrl: true, bio: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.friend.count({ where }),
    ]);

    // 归一化，把“对方”的信息抽出来
    const items = rows.map((r) => {
      const other = r.userId === me ? r.friend : r.user;
      return {
        id: other.id,
        nickname: other.nickname,
        avatarUrl: other.avatarUrl,
        bio: other.bio,
      };
    });
    return { items, total, page, pageSize };
  }

  // 解除好友（双向唯一记录之一，删除即可）
  async unfriend(me: string, otherId: string) {
    const res = await this.prisma.friend.deleteMany({
      where: {
        status: 'accepted',
        OR: [
          { userId: me, friendId: otherId },
          { userId: otherId, friendId: me },
        ],
      },
    });
    if (res.count === 0)
      throw new NotFoundException('Friend relation not found');
    return { ok: true };
  }

  // 查询与某人的关系状态（便于前端按钮态）
  async relation(me: string, otherId: string) {
    const r = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId: me, friendId: otherId },
          { userId: otherId, friendId: me },
        ],
      },
    });
    if (!r) return { status: 'none' };
    if (r.status === 'accepted') return { status: 'friends' };
    if (r.status === 'pending') {
      if (r.userId === me) return { status: 'outgoing' };
      if (r.friendId === me) return { status: 'incoming' };
    }
    return { status: 'unknown' };
  }
}
