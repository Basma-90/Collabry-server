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
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PublicationsModule } from './modules/publications/publications.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [AuthModule, AiFeaturesModule, BookmarksModule, CategoriesModule, ChatModule, CollaborationsModule, EventsModule, NotificationsModule, PrismaModule, ProfilesModule, PublicationsModule, RewardsModule, TokensModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
