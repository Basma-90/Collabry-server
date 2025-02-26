import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CloudinaryProvider } from 'src/storage/cloudinary/cloudinary.provider';
import { CloudinaryService } from 'src/storage/cloudinary/cloudinary.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    CloudinaryProvider,
    CloudinaryService,
  ],
})
export class UsersModule {}
