import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsResolver } from './alerts.resolver';
import { AlertsService } from './alerts.service';
import { DispatchService } from './dispatch.service';
import { SlackController } from './slack.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SlackController],
  providers: [AlertsResolver, AlertsService, DispatchService],
  exports: [AlertsService, DispatchService],
})
export class AlertsModule {}
