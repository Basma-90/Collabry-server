import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { sendOtpDto, VerifyEmailDto, PasswordResetDto, LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';

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
              findUnique: jest.fn(),
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
            sendOtp: jest.fn(),
            sendResetPasswordEmail: jest.fn(),
            sendVerificationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    const mailService = module.get<MailService>(MailService);
    const prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should register a user', async () => {
    const mockUser: RegisterDto = {
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
    const mockUser: LoginDto = {
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

  it('should refresh a token', async () => {
    const mockToken: RefreshTokenDto = {
      refreshToken: 'mockRefreshToken',
    };
    const mockResponse = {
      accessToken: 'mockAccessToken',
      refreshToken: 'mockRefreshToken',
    };
    jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockResponse);
    const result = await controller.refreshToken(mockToken);
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error if email is not provided for verification', async () => {
    const mockEmail: VerifyEmailDto = {
      email: '',
    };
    await expect(controller.verifyEmail(mockEmail)).rejects.toThrow();
  });

  it('should logout a user', async () => {
    const mockResponse = 'Logout successful';
    jest.spyOn(authService, 'logout').mockResolvedValue(mockResponse);
    const mockAuthHeader = 'Bearer mockToken';
    const result = await controller.logout(mockAuthHeader);
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error if authorization header is missing during logout', async () => {
    const mockAuthHeader = '';
    await expect(controller.logout(mockAuthHeader)).rejects.toThrow();
  });
});