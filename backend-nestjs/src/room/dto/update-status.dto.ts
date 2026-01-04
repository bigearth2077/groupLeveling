import { IsIn, IsString } from 'class-validator';
export class UpdateStatusDto {
  @IsString()
  roomId: string;

  @IsIn(['learning', 'rest', 'idle'])
  status: 'learning' | 'rest' | 'idle';
}
