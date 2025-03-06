import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { send } from 'process';
import { verify } from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
        {
          provide: AuthService,
          useValue: {
            getUserByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    const prismaService = module.get<PrismaService>(PrismaService);
    const jwtService = module.get<JwtService>(JwtService);
    const configService = module.get<ConfigService>(ConfigService);
    const mailService = module.get<MailService>(MailService);
  });
});
