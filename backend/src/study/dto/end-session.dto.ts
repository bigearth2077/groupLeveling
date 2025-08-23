import { IsISO8601 } from 'class-validator';

export class EndSessionDto {
  @IsISO8601()
  endTime: string; // ISO 字符串
}
