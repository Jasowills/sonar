import { Module } from '@nestjs/common';

import { MonitorsResolver } from './monitors.resolver';
import { MonitorsService } from './monitors.service';
import { CheckerService } from './checker.service';

@Module({
  providers: [MonitorsResolver, MonitorsService, CheckerService],
  exports: [MonitorsService],
})
export class MonitorsModule {}
