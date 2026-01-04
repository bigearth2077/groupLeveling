import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

type RankingItem = {
  userId: string;
  minutes: number;
  nickname: string;
  avatarUrl: string | null;
};

@Injectable()
export class RankingService {
  constructor(
    private prisma: PrismaService,
    private cache: RedisService,
  ) {}

  private key(scope: 'week' | 'all', limit: number) {
    return `ranking:${scope}:${limit}`;
  }

  async globalRanking(scope: 'week' | 'all', limit = 50) {
    const cacheKey = this.key(scope, limit);
    const ttl = scope === 'week' ? 60 : 300; // 周榜 1 分钟，全站 5 分钟
    const cached = await this.cache.getJSON<{ items: RankingItem[] }>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const where =
      scope === 'week'
        ? {
            type: 'learning' as const,
            durationMinutes: { not: null as any },
            startTime: { gte: from, lt: now },
          }
        : { type: 'learning' as const, durationMinutes: { not: null as any } };

    // groupBy 汇总学习分钟数
    const grouped = await this.prisma.studySession.groupBy({
      by: ['userId'],
      _sum: { durationMinutes: true },
      where,
      orderBy: { _sum: { durationMinutes: 'desc' } },
      take: limit,
    });

    const userIds = grouped.map((g) => g.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, avatarUrl: true },
    });
    const map = new Map(users.map((u) => [u.id, u]));

    const items: RankingItem[] = grouped.map((g) => ({
      userId: g.userId,
      minutes: Number(g._sum.durationMinutes ?? 0),
      nickname: map.get(g.userId)?.nickname ?? 'Unknown',
      avatarUrl: map.get(g.userId)?.avatarUrl ?? null,
    }));

    const result = { items };
    await this.cache.setJSON(cacheKey, result, ttl);
    return result;
  }

  async friendsRanking(me: string, scope: 'week' | 'all', limit = 50) {
    const cacheKey = `ranking:friends:${me}:${scope}:${limit}`;
    const ttl = scope === 'week' ? 30 : 120; // 好友榜缓存更短一点
    const cached = await this.cache.getJSON<{
      items: {
        userId: string;
        minutes: number;
        nickname: string;
        avatarUrl: string | null;
      }[];
    }>(cacheKey);
    if (cached) return cached;

    // 1) 取出“自己 + 所有已通过的好友ID”
    const rows = await this.prisma.friend.findMany({
      where: { status: 'accepted', OR: [{ userId: me }, { friendId: me }] },
      select: { userId: true, friendId: true },
    });
    const idSet = new Set<string>([me]);
    for (const r of rows) idSet.add(r.userId === me ? r.friendId : r.userId);
    const ids = Array.from(idSet);
    if (ids.length === 0) {
      const result = { items: [] };
      await this.cache.setJSON(cacheKey, result, ttl);
      return result;
    }

    // 2) 时间窗口 & 条件
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const where =
      scope === 'week'
        ? {
            type: 'learning' as const,
            durationMinutes: { not: null as any },
            userId: { in: ids },
            startTime: { gte: from, lt: now },
          }
        : {
            type: 'learning' as const,
            durationMinutes: { not: null as any },
            userId: { in: ids },
          };

    // 3) 聚合分钟数
    const grouped = await this.prisma.studySession.groupBy({
      by: ['userId'],
      _sum: { durationMinutes: true },
      where,
    });
    const gmap = new Map(
      grouped.map((g) => [g.userId, Number(g._sum.durationMinutes ?? 0)]),
    );

    // 4) 补全无记录用户（分钟=0），并取用户资料
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, nickname: true, avatarUrl: true },
    });
    const umap = new Map(users.map((u) => [u.id, u]));
    const items = ids.map((uid) => ({
      userId: uid,
      minutes: gmap.get(uid) ?? 0,
      nickname: umap.get(uid)?.nickname ?? 'Unknown',
      avatarUrl: umap.get(uid)?.avatarUrl ?? null,
    }));

    // 5) 排序 & 截断 & 缓存
    items.sort((a, b) => b.minutes - a.minutes);
    const result = { items: items.slice(0, Math.max(1, Math.min(limit, 200))) };
    await this.cache.setJSON(cacheKey, result, ttl);
    return result;
  }
}
