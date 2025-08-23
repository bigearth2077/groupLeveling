import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

export class SummaryQueryDto {
  @IsOptional()
  @IsIn(['learning', 'rest'])
  type?: 'learning' | 'rest' = 'learning';

  // 传 range=7d|30d 或者显式 from/to
  @IsOptional()
  @IsIn(['7d', '30d', 'custom'])
  range?: '7d' | '30d' | 'custom' = '7d';

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  // 统计按哪个时区的“天”聚合，默认 Asia/Shanghai（你在中国）
  @IsOptional()
  @IsString()
  tz?: string = 'Asia/Shanghai';
}
