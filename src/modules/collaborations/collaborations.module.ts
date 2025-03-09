import { Module } from '@nestjs/common';
import { CollaborationsController } from './collaborations.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import { CloudinaryProvider } from '../../storage/cloudinary/cloudinary.provider';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { CollaborationService } from './collaborations.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CollaborationsController],
  providers: [
    CollaborationService,
    PrismaService,
    JwtService,
    CloudinaryService,
    CloudinaryProvider,
    AuthService,
    MailService,
    NotificationsService,
  ],
})
export class CollaborationsModule {}
