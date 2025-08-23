import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { ListSessionsDto } from './dto/list-sessions.dto';
import { SummaryQueryDto } from './dto/summary-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudyService {
  constructor(private prisma: PrismaService) {}

  // 仅允许一个进行中会话
  async startSession(userId: string, dto: StartSessionDto) {
    const active = await this.prisma.studySession.findFirst({
      where: { userId, endTime: null as any },
      select: { id: true, startTime: true, type: true },
    });
    if (active)
      throw new BadRequestException('You already have an active session');

    const start = dto.startTime ? new Date(dto.startTime) : new Date();
    return this.prisma.studySession.create({
      data: {
        userId,
        type: dto.type,
        startTime: start,
        endTime: null,
        durationMinutes: null,
      },
    });
  }

  async endSession(userId: string, sessionId: string, dto: EndSessionDto) {
    const sess = await this.prisma.studySession.findUnique({
      where: { id: sessionId },
    });
    if (!sess || sess.userId !== userId)
      throw new NotFoundException('Session not found');
    if (sess.endTime) throw new BadRequestException('Session already ended');

    const end = new Date(dto.endTime);
    if (!(sess.startTime instanceof Date))
      sess.startTime = new Date(sess.startTime);
    if (isNaN(end.getTime())) throw new BadRequestException('Invalid endTime');
    if (end <= sess.startTime)
      throw new BadRequestException('endTime must be after startTime');

    const minutes = Math.floor(
      (end.getTime() - sess.startTime.getTime()) / 60000,
    );

    return this.prisma.studySession.update({
      where: { id: sessionId },
      data: {
        endTime: end,
        durationMinutes: minutes,
      },
    });
  }

  async getActive(userId: string) {
    return this.prisma.studySession.findFirst({
      where: { userId, endTime: null },
      orderBy: { startTime: 'desc' },
    });
  }

  async cancelActive(userId: string) {
    const active = await this.getActive(userId);
    if (!active) return { ok: true, deleted: 0 };
    await this.prisma.studySession.delete({ where: { id: active.id } });
    return { ok: true, deleted: 1 };
  }

  async list(userId: string, q: ListSessionsDto) {
    const where: Prisma.StudySessionWhereInput = { userId };
    if (q.type) where.type = q.type as any;

    // 构建一个 DateTimeFilter 对象，避免对 Date 或 undefined 使用展开运算
    const startFilter: Prisma.DateTimeFilter = {
      ...((where.startTime as Prisma.DateTimeFilter) ?? {}),
    };
    if (q.from) startFilter.gte = new Date(q.from);
    if (q.to) startFilter.lt = new Date(q.to);
    if (q.from || q.to) where.startTime = startFilter;

    const page = Number(q.page ?? 1);
    const pageSize = Number(q.pageSize ?? 20);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.studySession.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.studySession.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  /**
   * 统计汇总（日维度聚合）
   * - 按 tz 聚合到各天
   * - 默认统计 type='learning'
   * - 仅统计已结束会话（durationMinutes 非空）
   */
  async summary(userId: string, q: SummaryQueryDto) {
    const tz = q.tz ?? 'Asia/Tokyo';
    let from: Date, to: Date;

    if (q.range === 'custom' && q.from && q.to) {
      from = new Date(q.from);
      to = new Date(q.to);
    } else if (q.range === '30d') {
      to = new Date();
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // 默认 7d
      to = new Date();
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 原生 SQL：在 tz 下 date_trunc('day', start_time AT TIME ZONE tz)
    type Row = { day: string; minutes: number };
    const daily: Array<{ day: string; minutes: number }> =
      await this.prisma.$queryRawUnsafe(
        `
  SELECT
    (date_trunc('day', (s."startTime" AT TIME ZONE $1)))::date AS day,
    COALESCE(SUM(s."durationMinutes"),0) AS minutes
  FROM "StudySession" s
  WHERE s."userId" = $2
    AND s."durationMinutes" IS NOT NULL
    AND s."type"::text = $3            -- ★ 这里做类型转换
    AND s."startTime" >= $4
    AND s."startTime" < $5
  GROUP BY day
  ORDER BY day ASC
  `,
        tz,
        userId,
        q.type ?? 'learning', // 传入 'learning' 或 'rest'
        from,
        to,
      );

    // 总时长
    const totalRow: Array<{ total: number }> =
      await this.prisma.$queryRawUnsafe(
        `
  SELECT COALESCE(SUM(s."durationMinutes"),0) AS total
  FROM "StudySession" s
  WHERE s."userId" = $1
    AND s."durationMinutes" IS NOT NULL
    AND s."type"::text = $2            -- ★ 同样改这里
    AND s."startTime" >= $3
    AND s."startTime" < $4
  `,
        userId,
        q.type ?? 'learning',
        from,
        to,
      );

    return {
      type: q.type ?? 'learning',
      tz,
      from,
      to,
      totalMinutes: Number(totalRow?.[0]?.total ?? 0),
      daily: daily.map((r) => ({ date: r.day, minutes: Number(r.minutes) })),
    };
  }
}
