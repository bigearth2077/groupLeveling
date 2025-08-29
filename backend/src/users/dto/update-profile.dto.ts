import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(50) nickname?: string;
  @IsOptional() @IsUrl() avatarUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) bio?: string;
}
