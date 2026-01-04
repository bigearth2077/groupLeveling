import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('rooms')
export class RoomController {
  constructor(private rooms: RoomService) {}

  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.rooms.createRoom(dto.name);
  }

  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.rooms.listRooms(Number(page) || 1, Number(pageSize) || 50);
  }

  @Post(':id/join')
  async join(@CurrentUser() user: any, @Param('id') id: string) {
    await this.rooms.joinRoom(user.id, id, 'idle');
    return { status: 'joined' };
  }

  @Post(':id/leave')
  async leave(@CurrentUser() user: any, @Param('id') id: string) {
    await this.rooms.leaveRoom(user.id, id);
    return { status: 'left' };
  }

  @Get(':id/members')
  members(@Param('id') id: string) {
    return this.rooms.listMembers(id);
  }
}
