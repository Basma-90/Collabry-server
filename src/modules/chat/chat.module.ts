import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthService } from '../auth/auth.service';
import { MessageService } from './message.service';
import { CloudinaryProvider } from '../../storage/cloudinary/cloudinary.provider';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';

@Module({
    providers: [
        ChatGateway,
        ChatService,
        AuthService,
        MessageService,
        CloudinaryService,
        CloudinaryProvider,
        PrismaService,
        JwtService,
        MailService
    ],
    imports: [ProfilesModule,JwtModule], 
    controllers: [],
})
export class ChatModule {}
