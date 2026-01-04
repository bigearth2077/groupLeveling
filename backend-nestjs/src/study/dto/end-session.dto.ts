import { IsISO8601, IsInt, IsOptional, Min, Max } from 'class-validator';

export class EndSessionDto {
  // 不传则用服务器当前时间
  @IsOptional()
  @IsISO8601()
  endTime?: string;

  // 有效学习分钟数（去掉暂停时间）。要求 >=1，且不能超过实际经过分钟数（服务端再二次校验）
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12 * 60) // 单次会话上限 12h，可按需调整
  durationMinutes?: number;
}
