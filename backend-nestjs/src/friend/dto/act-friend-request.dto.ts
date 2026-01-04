import { IsIn } from 'class-validator';
export class ActFriendRequestDto {
  @IsIn(['accept', 'reject'])
  action: 'accept' | 'reject';
}
