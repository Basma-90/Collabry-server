import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import passport from 'passport';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/modules/mail/mail.service';
import { ConfigModule } from '@nestjs/config';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [PassportModule.register({defaultStrategy:'google'}), JwtModule, ConfigModule],
  providers: [AuthService, PrismaService, JwtService, ConfigService, MailService, GoogleStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
