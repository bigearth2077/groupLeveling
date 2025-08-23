import { IsString } from 'class-validator';
export class RefreshDto {
  @IsString() refreshToken: string; // 也可以改用 cookie 传
}
