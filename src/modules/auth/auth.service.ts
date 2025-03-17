import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as jwt from 'jsonwebtoken';
import { Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(email: string, password: string): Promise<Tokens> {
    const user = await this.getUserByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (!user.isEmailVerified)
      throw new UnauthorizedException('Email not verified');

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');

    return this.generateAndStoreTokens(user.id);
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<Tokens> {
    if (await this.getUserByEmail(email)) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    await this.sendOtp(newUser.email);
    return this.generateAndStoreTokens(newUser.id);
  }

  async sendOtp(email: string): Promise<void> {
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: { OTP: otp, OTPExpiry: otpExpiry },
    });
    this.mailService.sendVerificationEmail(email, otp);
  }

  async verifyOtp(email: string, otp: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (user.OTP !== otp) throw new UnauthorizedException('Invalid OTP');
    if (new Date() > user.OTPExpiry)
      throw new UnauthorizedException('OTP expired');
    await this.prisma.user.update({
      where: { email },
      data: {
        OTP: null,
        OTPExpiry: null,
        isOTPVerified: true,
        isEmailVerified: true,
      },
    });
  }

  async verifyEmail(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified)
      throw new ConflictException('Email already verified');
    if (!user.isOTPVerified)
      throw new UnauthorizedException('OTP not verified');
    await this.prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });
  }

  async passwordReset(email: string, newPassword: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (!user.isEmailVerified)
      throw new UnauthorizedException('Email not verified');
    if (!user.isOTPVerified)
      throw new UnauthorizedException('OTP not verified');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword, OTP: null, OTPExpiry: null },
    });
  }

  async generateAndStoreTokens(userId: string): Promise<Tokens> {
    const accessToken = await this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
    return { accessToken, refreshToken };
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, this.configService.get('privateKey.secret'), {
      expiresIn: this.configService.get('refreshTokenTTL.TTL'),
      algorithm: 'RS256',
    });
  }
  async generateAccessToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, this.configService.get('privateKey.secret'), {
      expiresIn: this.configService.get('accessTokenTTL.TTL'),
      algorithm: 'RS256',
    });
  }
  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }
  async refreshToken(refreshToken: string): Promise<Tokens> {
    const payload = jwt.verify(
      refreshToken,
      this.configService.get<string>('PUBLIC_KEY'),
      { algorithms: ['RS256'] },
    ) as { userId: string };
    const user = await this.getUserById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }
    const accessToken = await this.generateAccessToken(user.id);
    const newRefreshToken = await this.generateRefreshToken(user.id);
    user.refreshToken = newRefreshToken;
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: newRefreshToken,
      },
    });
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
  async logout(accessToken: string) {
    const payload = jwt.verify(
      accessToken,
      this.configService.get('publicKey.secret'),
    ) as { userId: string };
    const user = await this.getUserById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.refreshToken = null;
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: null,
      },
    });
    return 'Logout successful';
  }
  async googleLogin(req) {
    console.log(req);
    if (!req) {
      return 'No user from google';
    }
    const user = await this.getUserByEmail(req.email);
    if (!user) {
      const newUser = await this.prisma.user.create({
        data: {
          name: req.firstName + ' ' + req.lastName,
          email: req.email,
          password: await bcrypt.hash(req.accessToken, 10),
          isEmailVerified: true,
        },
      });
      const accessToken = await this.generateAccessToken(newUser.id);
      const refreshToken = await this.generateRefreshToken(newUser.id);
      newUser.refreshToken = refreshToken;
      await this.prisma.user.update({
        where: {
          id: newUser.id,
        },
        data: {
          refreshToken: refreshToken,
        },
      });
      return {
        accessToken,
        refreshToken,
      };
    }
    if (!user.isEmailVerified) {
      throw new Error('Email not verified');
    }
    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: refreshToken,
      },
    });
    return {
      accessToken,
      refreshToken,
    };
  }
  async verifyToken(token: string) {
    return jwt.verify(token, this.configService.get('publicKey.secret'));
  }
}
