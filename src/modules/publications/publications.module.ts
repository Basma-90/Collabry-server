import { Module } from '@nestjs/common';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';

import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import { CloudinaryProvider } from '../../storage/cloudinary/cloudinary.provider';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicationsController],
  providers: [
    PublicationsService,
    PrismaService,
    JwtService,
    CloudinaryService,
    CloudinaryProvider,
    AuthService,
    MailService,
  ],
})
export class PublicationsModule {}
