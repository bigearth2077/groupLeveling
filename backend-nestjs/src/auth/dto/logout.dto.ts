import { IsOptional, IsString } from 'class-validator';
export class LogoutDto {
  @IsOptional() @IsString() refreshToken?: string; // 不传则注销当前用户所有 refresh
}
