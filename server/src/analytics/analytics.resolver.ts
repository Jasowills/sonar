import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { AnalyticsEventModel } from './models/analytics-event.model';
import { AnalyticsSessionModel } from './models/analytics-session.model';
import {
  AnalyticsOverviewResult,
  PageViewTimeSeriesPoint,
  TopPageResult,
  SourceResult,
  EventTypeDistResult,
} from './models/analytics-overview.model';
import { AnalyticsService } from './analytics.service';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => AnalyticsOverviewResult)
  analyticsOverview(@Args('projectId') projectId: string) {
    return this.analyticsService.getOverview(projectId);
  }

  @Query(() => [PageViewTimeSeriesPoint])
  analyticsPageViews(
    @Args('projectId') projectId: string,
    @Args('from', { type: () => String, nullable: true }) from?: string,
    @Args('to', { type: () => String, nullable: true }) to?: string,
  ) {
    return this.analyticsService.getPageViewsTimeSeries(projectId, from, to);
  }

  @Query(() => [AnalyticsSessionModel])
  analyticsSessions(
    @Args('projectId') projectId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    return this.analyticsService.getSessions(projectId, limit);
  }

  @Query(() => AnalyticsSessionModel, { nullable: true })
  analyticsSession(@Args('id') id: string) {
    return this.analyticsService.getSession(id);
  }

  @Query(() => [AnalyticsEventModel])
  analyticsSessionEvents(@Args('sessionId') sessionId: string) {
    return this.analyticsService.getSessionEvents(sessionId);
  }

  @Query(() => [TopPageResult])
  analyticsTopPages(
    @Args('projectId') projectId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    return this.analyticsService.getTopPages(projectId, limit);
  }

  @Query(() => [SourceResult])
  analyticsSources(@Args('projectId') projectId: string) {
    return this.analyticsService.getSources(projectId);
  }

  @Query(() => [EventTypeDistResult])
  analyticsEventTypes(@Args('projectId') projectId: string) {
    return this.analyticsService.getEventTypes(projectId);
  }
}
