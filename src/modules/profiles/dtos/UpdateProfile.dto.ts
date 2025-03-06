import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Leo Messi' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'User bio' })
  @IsString()
  bio: string;

  @ApiProperty({ example: 'User linkedin' })
  @IsString()
  linkedin: string;

  @ApiProperty({ example: ['cpp', 'js', 'python'] })
  @IsString({ each: true })
  expertise: string[];

  @ApiProperty({ example: ['english', 'spanish'] })
  @IsString({ each: true })
  languages: string[];
}
