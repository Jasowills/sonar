import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeyGuard } from '../auth/api-key.guard';
import { AnalyticsService } from './analytics.service';
import { IngestAnalyticsInput } from './analytics.inputs';

@Controller('ingest/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  ingest(@Body() input: IngestAnalyticsInput, @Req() req: Request) {
    const events = input.events.map((e) => ({
      ...e,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
    }));
    const types = events.map((e) => e.type).join(', ');
    console.log(`[analytics] ingested ${events.length} events (${types}) for project ${req.projectId} session=${input.session?.sessionId ?? 'none'}`);
    return this.analyticsService.ingest(events, input.session ?? null, req.projectId, input.projectKey);
  }
}
