import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {BookmarksController} from './bookmarks.controller'; 
import { PrismaService } from '../prisma/prisma.service';
import { BookmarkService } from './bookmarks.service';
import { authGuard } from 'src/guards/auth.guard';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';

@Module({
    imports: [AuthModule],
    controllers: [BookmarksController],
    providers: [PrismaService,BookmarkService,authGuard,AuthService,MailService],
})
export class BookmarksModule {}
