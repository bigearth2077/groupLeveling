import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';

@Module({
  imports: [PrismaModule],
  providers: [FriendService, RankingService],
  controllers: [FriendController, RankingController],
})
export class FriendModule {}
