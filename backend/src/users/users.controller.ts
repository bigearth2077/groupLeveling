import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: any) {
    return this.users.findById(user.id).then((u: any) => ({
      id: u.id,
      email: u.email,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
    }));
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch('me/password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Public()
  @Get(':id/public')
  getPublic(@Param('id') id: string) {
    return this.users.getPublicProfile(id);
  }

  @Get('search/q')
  search(
    @Query('query') query: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.users.searchUsers(
      query,
      Number(page) || 1,
      Number(pageSize) || 20,
    );
  }

  @Delete('me')
  deleteMe(@CurrentUser() user: any) {
    return this.users.deleteMe(user.id);
  }
}
