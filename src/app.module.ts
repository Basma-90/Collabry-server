import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AiFeaturesModule } from './modules/ai-features/ai-features.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ChatModule } from './modules/chat/chat.module';
import { CollaborationsModule } from './modules/collaborations/collaborations.module';
import { EventsModule } from './modules/events/events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from './modules/mail/mail.module';
import { join } from 'path';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PublicationsModule } from './modules/publications/publications.module';
import { PrismaModule } from './prisma/prisma.module';
import { LikesModule } from './modules/likes/likes.module';
import configuration from '../config/configuration';

@Module({
  imports: [
    AuthModule,
    AiFeaturesModule,
    BookmarksModule,
    CategoriesModule,
    ChatModule,
    CollaborationsModule,
    EventsModule,
    NotificationsModule,
    PrismaModule,
    ProfilesModule,
    PublicationsModule,
    RewardsModule,
    TokensModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '..', '.env'),
      load: [configuration],
    }),
    MailModule,
    LikesModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService],
})
export class AppModule {}
