import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IncidentsResolver } from './incidents.resolver';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [PrismaModule, EventsModule, NotificationsModule],
  providers: [IncidentsResolver, IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
