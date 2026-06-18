import { Module } from '@nestjs/common';
import { AiResolver } from './ai.resolver';
import { AiService } from './ai.service';
import { AiCronService } from './ai.cron.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [AiResolver, AiService, AiCronService],
  exports: [AiService],
})
export class AiModule {}
