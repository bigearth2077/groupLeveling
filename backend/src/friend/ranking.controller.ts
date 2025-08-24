import { Controller, Get, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class RankingController {
  constructor(private ranking: RankingService) {}

  // 全站排行榜（默认 week）
  @Get('rankings')
  global(
    @CurrentUser() _user: any,
    @Query('scope') scope?: string,
    @Query('limit') limit?: string,
  ) {
    const s = scope === 'all' ? 'all' : 'week';
    const l = Math.max(1, Math.min(Number(limit) || 50, 200));
    return this.ranking.globalRanking(s as 'week' | 'all', l);
  }

  @Get('friends/rankings')
  friends(
    @CurrentUser() user: any,
    @Query('scope') scope?: string,
    @Query('limit') limit?: string,
  ) {
    const s = scope === 'all' ? 'all' : 'week';
    const l = Math.max(1, Math.min(Number(limit) || 50, 200));
    return this.ranking.friendsRanking(user.id, s as 'week' | 'all', l);
  }
}
