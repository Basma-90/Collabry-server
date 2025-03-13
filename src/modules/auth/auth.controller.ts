import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  Headers,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  PasswordResetDto,
  RefreshTokenDto,
  RegisterDto,
  RequestPasswordResetDto,
  SendVerificationEmailDto,
} from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { query } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { authGuard } from '../../guards/auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {}

  @Post('/login')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    example: {
      accessToken: 'string',
      refreshToken: 'string',
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({ type: LoginDto })
  async Login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('/register')
  @ApiOperation({ summary: 'Register' })
  @ApiResponse({
    status: 200,
    description: 'Register successful',
    example: {
      accessToken: 'string',
      refreshToken: 'string',
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({ type: RegisterDto })
  async Register(@Body() body: RegisterDto) {
    return this.authService.register(body.name, body.email, body.password);
  }

  @Post('/send-verification-email')
  @ApiOperation({ summary: 'Send Verification Email' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({ type: SendVerificationEmailDto })
  async sendEmail(@Body() body: SendVerificationEmailDto) {
    return this.authService.sendVerificationEmail(body.email);
  }

  @Post('/refresh-token')
  @ApiOperation({ summary: 'Refresh Token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed',
    example: {
      accessToken: 'string',
      refreshToken: 'string',
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({
    type: RefreshTokenDto,
  })
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('/request-password-reset')
  @ApiOperation({ summary: 'Request Password Reset' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({ type: RequestPasswordResetDto })
  async requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('/password-reset')
  @ApiOperation({ summary: 'Password Reset' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({ type: PasswordResetDto })
  async passwordReset(
    @Body() body: PasswordResetDto,
    @Query('token') token: string,
  ) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    return this.authService.passwordReset(body.email, body.password, token);
  }

  @Get('/verify-email')
  @ApiOperation({ summary: 'Verify Email' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async verifyEmailGet(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    return this.authService.verifyEmail(token);
  }

  @Post('/logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async logout(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new BadRequestException('Authorization header is required');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    return this.authService.logout(token);
  }

  @Get('/google')
  @ApiOperation({ summary: 'Google Auth' })
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req) {
    return req.user;
  }

  @Get('/google/callback')
  @ApiOperation({ summary: 'Google AuthRedirect' })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req) {
    return await this.authService.googleLogin(req.user);
  }

  @Get('/me')
  @ApiOperation({ summary: 'Get User' })
  @UseGuards(authGuard)
  async getUser(@Request() req) {
    return req.user;
  }
}
