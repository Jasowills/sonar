import { Field, Int, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TopPageResult {
  @Field() url!: string;
  @Field(() => Int) views!: number;
  @Field(() => Int) uniqueVisitors!: number;
}

@ObjectType()
export class AnalyticsOverviewResult {
  @Field(() => Int) totalPageViews!: number;
  @Field(() => Int) uniqueVisitors!: number;
  @Field(() => Float) bounceRate!: number;
  @Field(() => Int, { nullable: true }) avgSessionDuration!: number | null;
  @Field(() => [TopPageResult]) topPages!: TopPageResult[];
}

@ObjectType()
export class PageViewTimeSeriesPoint {
  @Field() date!: string;
  @Field(() => Int) count!: number;
}

@ObjectType()
export class SourceResult {
  @Field() referrer!: string;
  @Field(() => Int) count!: number;
}

@ObjectType()
export class EventTypeDistResult {
  @Field() type!: string;
  @Field(() => Int) count!: number;
}
