import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsEmail()
  @ApiProperty({ example: 'zeyad@gmail.com' })
  email: string;

  @IsString()
  @ApiProperty({ example: 'password' })
  password: string;
}
