import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { ActFriendRequestDto } from './dto/act-friend-request.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('friends')
export class FriendController {
  constructor(private friend: FriendService) {}

  // 发送请求（若对方有 pending -> 直接达成好友）
  @Post('requests')
  create(@CurrentUser() user: any, @Body() dto: CreateFriendRequestDto) {
    return this.friend.createRequest(user.id, dto.friendId);
  }

  // 待处理（别人给我的）
  @Get('requests/incoming')
  incoming(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.friend.incomingRequests(
      user.id,
      Number(page) || 1,
      Number(pageSize) || 20,
    );
  }

  // 我发出的待处理
  @Get('requests/outgoing')
  outgoing(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.friend.outgoingRequests(
      user.id,
      Number(page) || 1,
      Number(pageSize) || 20,
    );
  }

  // 同意/拒绝
  @Post('requests/:id/act')
  act(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ActFriendRequestDto,
  ) {
    return this.friend.actOnRequest(user.id, id, dto.action);
  }

  // 我的好友列表
  @Get()
  list(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.friend.listFriends(
      user.id,
      Number(page) || 1,
      Number(pageSize) || 50,
    );
  }

  // 解除好友
  @Delete(':otherId')
  unfriend(@CurrentUser() user: any, @Param('otherId') otherId: string) {
    return this.friend.unfriend(user.id, otherId);
  }

  // 与某人的关系状态
  @Get('relation/:otherId')
  relation(@CurrentUser() user: any, @Param('otherId') otherId: string) {
    return this.friend.relation(user.id, otherId);
  }
}
