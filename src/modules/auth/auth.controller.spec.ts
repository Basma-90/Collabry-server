import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { access } from 'fs';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendResetPasswordEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should register a user', async () => {
    const mockUser = {
      name: 'test',
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockResponse = {
      accessToken: 'mockAccessToken',
      refreshToken: 'mockRefreshToken',
    };

    jest.spyOn(authService, 'register').mockResolvedValue(mockResponse);
    const result = await controller.Register(mockUser);

    expect(result).toEqual(mockResponse); 
    expect(authService.register).toHaveBeenCalledWith(
      mockUser.name,
      mockUser.email,
      mockUser.password,
    );
  });

  it('should login a user', async () => {
    const mockUser = {
      name: 'test',
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockResponse = {
      accessToken: 'mockAccessToken',
      refreshToken: 'mockRefreshToken',
    };

    jest.spyOn(authService, 'login').mockResolvedValue(mockResponse);
    const result = await controller.Login(mockUser);

    expect(result).toEqual(mockResponse);
  });

  it('should send a verification email', async () => {
    const mockEmail = {
      email: 'email.example.com',
    };

    const mockResponse = 'Email sent';
    jest.spyOn(authService, 'sendVerificationEmail').mockResolvedValue(mockResponse);
    const result = await controller.sendEmail(mockEmail);
    expect(result).toEqual(mockResponse);
  });

  it('should refresh a token', async () => {
    const mockToken = {
      refreshToken: 'mockRefreshToken',
    };
    const mockResponse = {
      accessToken: 'mock AccessToken',
      refreshToken: 'mock RefreshToken',
    };
    jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockResponse);
    const result = await controller.refreshToken(mockToken);
    expect(result).toEqual(mockResponse);
  });

  it('should request a password reset', async () => {
    const mockEmail = {
      email: 'email@example.com',
    };
    const mockResponse = 'Email sent';
    jest.spyOn(authService,'requestPasswordReset').mockResolvedValue(mockResponse);
    const result = await controller.requestPasswordReset(mockEmail);
    expect(result).toEqual(mockResponse);
  });

  it('should reset a password', async () => {
    const mockPasswordReset = {
      email: 'email@example.com',
      password: 'Password123!',
    };
    const mockToken = 'mockToken';
    const mockResponse = 'Password reset successful';
    jest.spyOn(authService, 'passwordReset').mockResolvedValue(mockResponse);
    const result = await controller.passwordReset(mockPasswordReset, mockToken);
    expect(result).toEqual(mockResponse);
  });

  it('should verify an email', async () => {
    const mockEmail = 'email@example.com';
    const mockToken = 'mockToken';
    const mockResponse = 'Email verified';
    jest.spyOn(authService, 'verifyEmail').mockResolvedValue(mockResponse);
    const result = await controller.verifyEmailGet(mockToken);
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error if token is not provided', async () => {
    const mockToken = '';
    await expect(controller.verifyEmailGet(mockToken)).rejects.toThrow();
  });

  it('should logout a user', async () => {
    const mockResponse = 'Logout successful';
    jest.spyOn(authService, 'logout').mockResolvedValue(mockResponse);
    const mockAuthHeader = 'Bearer mockToken';
    const result = await controller.logout(mockAuthHeader);
    expect(result).toEqual(mockResponse);
  });
  
  

});