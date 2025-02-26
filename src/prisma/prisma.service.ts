import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('database.url'),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    // console.log('Connected to the database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    // console.log('Disconnected from the database');
  }
}
