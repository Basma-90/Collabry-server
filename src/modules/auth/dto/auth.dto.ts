import { CONTAINS, IsEmail, IsNotEmpty, IsString, MinLength, Contains,Matches, matches } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
      description: 'Name of the user',
      type: String,
      required: true,
      example: 'John Doe',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    name: string;
    
    @ApiProperty({
      description: 'Email of the user',
      type: String,
      required: true,
      example: 'email@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
    
    @ApiProperty({
      description: 'Password of the user',
      type: String,
      required: true,
      example: 'Password!123',
    })
    @IsNotEmpty()
    @MinLength(6)
    @Matches(/(?=.*[a-z])/, {
      message: 'password must contain at least one lowercase letter',
    })
    @Matches(/(?=.*[A-Z])/, {
      message: 'password must contain at least one uppercase letter',
    })
    @Matches(/(?=.*[0-9])/, {
      message: 'password must contain at least one digit',
    })
    @Matches(/(?=.*[!@#$%^&*])/, {
      message: 'password must contain at least one special character',
    })
    password: string;
}

export class VerifyOtplDto {
    @ApiProperty({
      description: 'Email of the user',
      type: String,
      required: true,
      example: 'email@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
      description: 'OTP of the user',
      type: Number,
      required: true,
      example: 123456
    })
    @IsNotEmpty()
    otp: string;
}

export class VerifyEmailDto {
    @ApiProperty({
      description: 'Email of the user',
      type: String,
      required: true,
      example: 'email@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class sendOtpDto {
    @ApiProperty({
      description: 'Email of the user',
      type: String,
      required: true,
      example: 'email@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class RefreshTokenDto {
    @ApiProperty({
      description: 'Refresh token of the user',
      type: String,
      required: true,
      example: 'refreshToken',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
export class PasswordResetDto {
    @ApiProperty({
      description: 'New password of the user',
      type: String,
      required: true,
      example: 'Password!123',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/, {
      message: 'password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
    })
    password: string;
    
    @ApiProperty({
      description: 'email of the user',
      type: String,
      required: true,
      example: 'email@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class LoginDto {
    @ApiProperty({
      description: 'Email of the user',
      type: String,
      required: true,
      example: 'email@example.com', 
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;
    
    @ApiProperty({
      description: 'Password of the user',
      type: String,
      required: true,
      example: 'Password!123',
    })
    @IsNotEmpty()
    password: string;
}

