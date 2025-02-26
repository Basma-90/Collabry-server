import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryProvider } from 'src/storage/cloudinary/cloudinary.provider';
import { CloudinaryService } from 'src/storage/cloudinary/cloudinary.service';
import { AuthService } from '../auth/auth.service';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, MailModule],

  controllers: [ProfilesController],
  providers: [
    ProfilesService,

    PrismaService,
    ConfigService,
    JwtService,
    CloudinaryService,
    CloudinaryProvider,
    AuthService,
  ],
})
export class ProfilesModule {}
