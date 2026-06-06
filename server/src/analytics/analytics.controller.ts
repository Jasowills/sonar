import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';

import { ApiKeyGuard } from '../auth/api-key.guard';
import { AnalyticsService } from './analytics.service';
import { IngestAnalyticsInput } from './analytics.inputs';

@Controller('ingest/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @SkipThrottle()
  @UseGuards(ApiKeyGuard)
  @Post()
  ingest(@Body() input: IngestAnalyticsInput, @Req() req: Request) {
    const events = input.events.map((e) => ({
      ...e,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
    }));
    return this.analyticsService.ingest(events, input.session ?? null, req.projectId!);
  }
}
