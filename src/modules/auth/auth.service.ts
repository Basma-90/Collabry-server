import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Tokens } from './types';
import * as jwt from 'jsonwebtoken';
import { MailService } from '../mail/mail.service';
import { config } from 'dotenv';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/auth.dto';
config();

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}
  async login(email: string, password: string): Promise<Tokens> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.isEmailVerified) {
      throw new Error('Email not verified');
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new Error('Invalid credentials');
    }
    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await this.prismaService.user.update({
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
  async register(registerDto: RegisterDto): Promise<Tokens> {
    const user = await this.getUserByEmail(registerDto.email);
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);
    const newUser = await this.prismaService.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
      },
    });

    const profile = await this.prismaService.profile.create({
      data: {
        user: {
          connect: {
            id: newUser.id,
          },
        },
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      },
    });

    const accessToken = await this.generateAccessToken(newUser.id);
    const refreshToken = await this.generateRefreshToken(newUser.id);
    newUser.refreshToken = refreshToken;
    await this.prismaService.user.update({
      where: {
        id: newUser.id,
      },
      data: {
        refreshToken: refreshToken,
      },
    });
    await this.mailService.sendVerificationEmail(
      newUser.email,
      profile.firstName + ' ' + profile.lastName,
      `${this.configService.get('emailVerificationURL.URL')}?token=${await this.generateEmailVerificationToken({ email: newUser.email })}`,
    );
    return {
      accessToken,
      refreshToken,
    };
  }
  async verifyEmail(token: string) {
    const payload = jwt.verify(
      token,
      this.configService.get('privateKey.secret'),
    ) as Prisma.UserWhereUniqueInput;
    const user = await this.getUserByEmail(payload.email);
    if (!user) {
      throw new BadGatewayException('User not found');
    }
    user.isEmailVerified = true;
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        isEmailVerified: true,
      },
    });
    return 'Email verified';
  }
  async requestPasswordReset(email: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const token = await this.generatePasswordResetToken({ email: user.email });
    const resetLink = `${this.configService.get('passwordResetURL.URL')}?token=${token}`;
    this.mailService.sendResetPasswordEmail(
      user.email,
      user.profile.firstName + ' ' + user.profile.lastName,
      resetLink,
    );
    return 'Email sent';
  }
  async passwordReset(email: string, password: string, token: string) {
    const payload = jwt.verify(
      token,
      this.configService.get('privateKey.secret'),
    ) as Prisma.UserWhereUniqueInput;
    if (payload.email !== email) {
      throw new BadRequestException('Invalid token');
    }
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    return 'Password reset successful';
  }
  async getUserByEmail(email: string) {
    return await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
      include: {
        profile: true,
      },
    });
  }
  async getUserById(userId: string) {
    if (!userId) {
      throw new BadGatewayException('User not found');
    }
    return await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
  }
  async generateEmailVerificationToken(payload: Prisma.UserWhereUniqueInput) {
    return jwt.sign(payload, this.configService.get('privateKey.secret'), {
      expiresIn: '1d',
      algorithm: 'RS256',
    });
  }
  async generatePasswordResetToken(payload: Prisma.UserWhereUniqueInput) {
    return jwt.sign(payload, this.configService.get('privateKey.secret'), {
      expiresIn: '1d',
      algorithm: 'RS256',
    });
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
  async refreshToken(refreshToken: string): Promise<Tokens> {
    const payload = jwt.verify(
      refreshToken,
      this.configService.get<string>('PUBLIC_KEY'),
      { algorithms: ['RS256'] },
    ) as { userId: string };
    const user = await this.getUserById(payload.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.refreshToken !== refreshToken) {
      throw new BadRequestException('Invalid refresh token');
    }
    const accessToken = await this.generateAccessToken(user.id);
    const newRefreshToken = await this.generateRefreshToken(user.id);
    user.refreshToken = newRefreshToken;
    await this.prismaService.user.update({
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
  async sendVerificationEmail(email: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    await this.mailService.sendVerificationEmail(
      user.email,
      user.profile.firstName + ' ' + user.profile.lastName,
      `${this.configService.get('emailVerificationURL.URL')}?token=${await this.generateEmailVerificationToken({ email: user.email })}`,
    );
    return 'Email sent';
  }
  async logout(accessToken: string) {
    const payload = jwt.verify(
      accessToken,
      this.configService.get('publicKey.secret'),
    ) as { userId: string };
    const user = await this.getUserById(payload.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.refreshToken = null;
    await this.prismaService.user.update({
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
    if (!req.user) {
      return 'No user from google';
    }
    const user = await this.getUserByEmail(req.user.email);
    if (!user) {
      const newUser = await this.prismaService.user.create({
        data: {
          email: req.user.email,
          password: await bcrypt.hash(req.user.id, 10),
          isEmailVerified: true,
        },
      });
      const profile = await this.prismaService.profile.create({
        data: {
          user: {
            connect: {
              id: newUser.id,
            },
          },
          firstName: req.user.firstName,
          lastName: req.user.lastName,
        },
      });
      const accessToken = await this.generateAccessToken(newUser.id);
      const refreshToken = await this.generateRefreshToken(newUser.id);
      newUser.refreshToken = refreshToken;
      await this.prismaService.user.update({
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
      throw new BadGatewayException('Email not verified');
    }
    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await this.prismaService.user.update({
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
