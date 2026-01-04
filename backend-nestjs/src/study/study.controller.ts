import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { StudyService } from './study.service';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { ListSessionsDto } from './dto/list-sessions.dto';
import { SummaryQueryDto } from './dto/summary-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('study')
export class StudyController {
  constructor(private study: StudyService) {}

  @Post('sessions/start')
  start(@CurrentUser() user: any, @Body() dto: StartSessionDto) {
    return this.study.startSession(user.id, dto);
  }

  @Post('sessions/:id/end')
  end(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: EndSessionDto,
  ) {
    return this.study.endSession(user.id, id, dto);
  }

  @Get('sessions/active')
  active(@CurrentUser() user: any) {
    return this.study.getActive(user.id);
  }

  @Delete('sessions/active')
  cancelActive(@CurrentUser() user: any) {
    return this.study.cancelActive(user.id);
  }

  @Get('sessions')
  list(@CurrentUser() user: any, @Query() q: ListSessionsDto) {
    return this.study.list(user.id, q);
  }

  @Get('stats/summary')
  summary(@CurrentUser() user: any, @Query() q: SummaryQueryDto) {
    return this.study.summary(user.id, q);
  }
}
