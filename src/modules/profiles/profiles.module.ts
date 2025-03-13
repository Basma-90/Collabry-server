import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryProvider } from '../../storage/cloudinary/cloudinary.provider';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import { AuthService } from '../auth/auth.service';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [PrismaModule, MailModule],

  controllers: [ProfilesController],
  providers: [
    ProfilesService,
    PrismaService,
    JwtService,
    CloudinaryService,
    CloudinaryProvider,
    AuthService,
    MailService,
  ],
})
export class ProfilesModule {}
