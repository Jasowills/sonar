import { Module } from '@nestjs/common';

import { EventsModule } from '../events/events.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MonitorsResolver } from './monitors.resolver';
import { MonitorsService } from './monitors.service';
import { CheckerService } from './checker.service';

@Module({
  imports: [EventsModule, IncidentsModule, NotificationsModule],
  providers: [MonitorsResolver, MonitorsService, CheckerService],
  exports: [MonitorsService],
})
export class MonitorsModule {}
