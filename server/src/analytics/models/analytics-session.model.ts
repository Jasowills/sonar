import { Field, Int, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AnalyticsSessionModel {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  visitorId?: string | null;

  @Field()
  projectId!: string;

  @Field()
  startUrl!: string;

  @Field(() => String, { nullable: true })
  referrer?: string | null;

  @Field(() => String, { nullable: true })
  userAgent?: string | null;

  @Field(() => String, { nullable: true })
  ip?: string | null;

  @Field(() => String, { nullable: true })
  country?: string | null;

  @Field(() => Int)
  pageViews!: number;

  @Field(() => Int)
  eventCount!: number;

  @Field(() => Int, { nullable: true })
  duration?: number | null;

  @Field()
  isBounce!: boolean;

  @Field()
  startedAt!: Date;

  @Field()
  lastActivityAt!: Date;

  // Intelligence fields
  @Field(() => Int, { nullable: true })
  frustrationScore?: number | null;

  @Field(() => Int, { nullable: true })
  interestingnessScore?: number | null;

  @Field(() => String, { nullable: true })
  userIntent?: string | null;

  @Field(() => Float, { nullable: true })
  economicImpact?: number | null;

  @Field()
  hasFrustrationSignals!: boolean;

  @Field()
  hasFormInteraction!: boolean;

  @Field()
  hasErrors!: boolean;

  @Field(() => Int)
  totalErrors!: number;

  @Field(() => Int)
  totalRageClicks!: number;

  @Field(() => Int)
  totalDeadClicks!: number;

  @Field(() => String, { nullable: true })
  browser?: string | null;

  @Field(() => String, { nullable: true })
  os?: string | null;

  @Field(() => String, { nullable: true })
  device?: string | null;

  @Field(() => Int, { nullable: true })
  activeTime?: number | null;

  @Field()
  crashDetected!: boolean;

  @Field(() => String, { nullable: true })
  videoUrl?: string | null;
}
