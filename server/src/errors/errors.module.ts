import { Module } from '@nestjs/common';

import { ApiKeysModule } from '../api-keys/api-keys.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ErrorsController } from './errors.controller';
import { ErrorsResolver } from './errors.resolver';
import { ErrorsService } from './errors.service';

@Module({
  imports: [ApiKeysModule, EventsModule, NotificationsModule, PrismaModule],
  controllers: [ErrorsController],
  providers: [ErrorsResolver, ErrorsService],
  exports: [ErrorsService],
})
export class ErrorsModule {}
