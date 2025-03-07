import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import { CloudinaryProvider } from '../../storage/cloudinary/cloudinary.provider';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    PrismaService,
    JwtService,
    CloudinaryService,
    CloudinaryProvider,
    AuthService,
    MailService,
  ],
})
export class CommentsModule {}
