import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import { mailerConfig } from './mail.config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [MailerModule.forRootAsync({
    useFactory: (configService: ConfigService) => mailerConfig(configService),
    inject: [ConfigService],
  })],
  providers: [MailService, ConfigService],
  exports: [MailService], 
})
export class MailModule {}