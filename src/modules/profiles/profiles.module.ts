import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryProvider } from '../cloudinary/cloudinary.provider';

@Module({
  imports: [PrismaModule],

  controllers: [ProfilesController],
  providers: [
    ProfilesService,
    PrismaService,
    ConfigService,
    JwtService,
    CloudinaryService,
    CloudinaryProvider,
  ],
})
export class ProfilesModule {}
