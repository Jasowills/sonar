import { Module } from '@nestjs/common';

import { ApiKeysModule } from '../api-keys/api-keys.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [ApiKeysModule, EventsModule, PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsResolver, AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
