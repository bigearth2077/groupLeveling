import { IsIn, IsInt, IsOptional, IsISO8601, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListSessionsDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsIn(['learning', 'rest'])
  type?: 'learning' | 'rest';

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 1 : Number(value)))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 20 : Number(value)))
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
