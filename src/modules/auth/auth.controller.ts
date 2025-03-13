import { BadRequestException, Body, Controller, Post, Query, Headers, Request, UseGuards, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, PasswordResetDto, RefreshTokenDto, RegisterDto, RequestPasswordResetDto, SendVerificationEmailDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { query } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { authGuard } from 'src/guards/auth.guard';
import { Logger } from '@nestjs/common';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    constructor(private authService
        : AuthService, configService: ConfigService) {
    }

    @Post('/login')
    @ApiOperation({ summary: 'Login' })
    @ApiResponse({
        status: 200, description: 'Login successful', example: {
            accessToken: 'string',
            refreshToken: 'string',
        }
    })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiBody({ type: LoginDto })
    async Login(@Body() body: LoginDto) {
        try {
            return await this.authService.login(body.email, body.password);
        } catch (error: any) {
            this.logger.error('Login failed', error.stack);
            if(error.message?.includes('User not found')){
                throw new UnauthorizedException('User not found');
            }
            if(error.message?.includes('Email not verified')){
                throw new UnauthorizedException('Email not verified');
            }
            if(error.message?.includes('Invalid credentials')){
                throw new UnauthorizedException('Invalid credentials');
            }
            throw new UnauthorizedException(error.response?.data?.message || 'Invalid credentials');
        }
    }

    @Post('/register')
    @ApiOperation({ summary: 'Register' })
    @ApiResponse({
        status: 200, description: 'Register successful', example: {
            accessToken: 'string',
            refreshToken: 'string',
        }
    })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiBody({ type: RegisterDto })
    async Register(@Body() body: RegisterDto) {
        try {
            return await this.authService.register(body.name, body.email, body.password);
        } catch (error: any) {
            this.logger.error('Register failed', error.stack);
            if (error.message?.includes('User already exists')) {
                throw new BadRequestException('User already exists');
            }
            throw new BadRequestException(error.message || 'Registration failed')
        }
    }

    @Post('/send-verification-email')
    @ApiOperation({ summary: 'Send Verification Email' })
    @ApiResponse({ status: 200, description: 'Email sent' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiBody({ type: SendVerificationEmailDto })
    async sendEmail(@Body() body: SendVerificationEmailDto) {
        try {
            return await this.authService.sendVerificationEmail(body.email);
        }
        catch (error) {
            this.logger.error('Send verification email failed', error.stack);
            throw new BadRequestException(
                error.response?.data?.message || 'Failed to send verification email'
            );
        }
    }

    @Post('/refresh-token')
    @ApiOperation({ summary: 'Refresh Token' })
    @ApiResponse({
        status: 200, description: 'Token refreshed', example: {
            accessToken
                : 'string', refreshToken: 'string',
        }
    })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiBody({
        type: RefreshTokenDto
    })
    async refreshToken(@Body() body: RefreshTokenDto) {
        try {
            return await this.authService.refreshToken(body.refreshToken);
        } catch (error: any) {
            this.logger.error('Refresh token failed', error.stack);
            throw new BadRequestException(error.message || 'Failed to refresh token');
        }
    }

    @Post('/request-password-reset')
    @ApiOperation({ summary: 'Request Password Reset' })
    @ApiResponse({ status: 200, description: 'Email sent' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiBody({ type: RequestPasswordResetDto })
    async requestPasswordReset(@Body() body: RequestPasswordResetDto) {
        try {
            return await this.authService.requestPasswordReset(body.email);
        } catch (error: any) {
            this.logger.error('request password reset failed', error.stack);
            throw new BadRequestException(error.response?.data?.message || 'Failed to request password reset');
        }
    }

    @Post('/password-reset')
    @ApiOperation({ summary: 'Password Reset' })
    @ApiResponse({ status: 200, description: 'Password reset successful' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiBody({ type: PasswordResetDto })
    async passwordReset(
        @Body() body: PasswordResetDto,
        @Query('token') token: string,) {
        if (!token) {
            throw new BadRequestException('Token is required');
        }
        try {
            return await this.authService.passwordReset(body.email, body.password, token);
        } catch (error: any) {
            this.logger.error('reset password failed', error.stack);
            throw new BadRequestException(error.response?.data?.message || 'Failed to reset password');
        }
    }

    @Get('/verify-email')
    @ApiOperation({ summary: 'Verify Email' })
    @ApiResponse({ status: 200, description: 'Email verified' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async verifyEmailGet(@Query('token') token: string) {
        if (!token) {
            throw new BadRequestException('Token is required');
        }
        try {
            return await  this.authService.verifyEmail(token);
        }
        catch (error: any) {
            this.logger.error('verify email failed', error.stack);
            throw new BadRequestException(error.response?.data?.message || 'Failed to verify email');
        }
    }

    @Post('/logout')
    @ApiOperation({ summary: 'Logout' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async logout(@Headers('authorization') authHeader: string) {
        try {
            if (!authHeader) {
                throw new BadRequestException('Authorization header is required');
            }
            const token = authHeader.split(' ')[1];
            if (!token) {
                throw new BadRequestException('Token is required');
            }
            return await this.authService.logout(token);
        }
        catch (error: any) {
            this.logger.error('logout failed', error.stack);
            throw new BadRequestException(error.response?.data?.message || 'Failed to logout');
        }
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
        try {
            return await this.authService.googleLogin(req.user);
        }
        catch (error: any) {
            this.logger.error('Google login failed', error.stack);
            throw new BadRequestException(error.message || 'Failed to login with google');
        }
    }

    @Get('/me')
    @ApiOperation({ summary: 'Get User' })
    @UseGuards(authGuard)
    async getUser(@Request() req) {
        return req.user;
    }
}


