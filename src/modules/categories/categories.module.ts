import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import { CloudinaryProvider } from '../../storage/cloudinary/cloudinary.provider';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { PublicationsModule } from '../publications/publications.module';

@Module({
  imports: [PrismaModule, PublicationsModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    PrismaService,

    JwtService,
    CloudinaryService,

    CloudinaryProvider,
    AuthService,
    MailService,
  ],
})
export class CategoriesModule {}
