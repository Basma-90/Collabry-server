import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import { CloudinaryProvider } from '../../storage/cloudinary/cloudinary.provider';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [PrismaModule],
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
