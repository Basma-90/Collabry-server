import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenSender } from 'src/utils/sendToken';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: registerDto.email,
      },
    });
    if (user) {
      throw new UnauthorizedException('User already exists');
    }
    const newUser = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: registerDto.password,
        profile: {
          create: {},
        },
      },
    });
    return 'user created successfully';
  }
  async loginAdmin(loginDto: LoginDto) {
    const admin = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (admin.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const tokenSender = new TokenSender(this.configService, this.jwtService);
    return tokenSender.sendToken(admin.id);
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    if (!payload || payload.id == null) {
      throw new UnauthorizedException('Invalid token');
    }
    const accessToken = await this.jwtService.signAsync(
      {
        id: payload.id,
      },
      {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      },
    );
    return { accessToken };
  }
}
