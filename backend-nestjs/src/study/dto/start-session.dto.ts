import { IsIn, IsOptional, IsISO8601 } from 'class-validator';

export class StartSessionDto {
  @IsIn(['learning', 'rest'])
  type: 'learning' | 'rest';

  // 不传则用服务端当前时间
  @IsOptional()
  @IsISO8601()
  startTime?: string;
}
