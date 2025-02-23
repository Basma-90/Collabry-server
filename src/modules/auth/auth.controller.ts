import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/gurads/auth.guard';
import { RolesGuard } from 'src/common/gurads/roles.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refreshToken.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiBody({ type: LoginDto })
  async register(@Body() registerDto: LoginDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Returns access and refresh tokens',
  })
  @ApiBody({ type: LoginDto })
  async loginAdmin(@Body() loginDto: LoginDto) {
    const { accessToken, refreshToken } =
      await this.authService.loginAdmin(loginDto);
    return {
      accessToken,
      refreshToken,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get('protected')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Protected route example' })
  @ApiResponse({ status: 200, description: 'Returns protected data' })
  async protectedRoute(@Req() req) {
    return { message: 'Protected data', user: req.user };
  }
}
