import { Field, Int, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AnalyticsEventModel {
  @Field()
  id!: string;

  @Field()
  type!: string;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field()
  url!: string;

  @Field(() => String, { nullable: true })
  referrer?: string | null;

  @Field(() => String, { nullable: true })
  userAgent?: string | null;

  @Field(() => Int, { nullable: true })
  viewportWidth?: number | null;

  @Field(() => Int, { nullable: true })
  viewportHeight?: number | null;

  @Field(() => Int, { nullable: true })
  screenWidth?: number | null;

  @Field(() => Int, { nullable: true })
  screenHeight?: number | null;

  @Field(() => String, { nullable: true })
  payload?: string | null;

  @Field()
  projectId!: string;

  @Field(() => String, { nullable: true })
  sessionId?: string | null;

  @Field(() => String, { nullable: true })
  visitorId?: string | null;

  @Field(() => Float, { nullable: true })
  severity?: number | null;

  @Field(() => String, { nullable: true })
  fingerprint?: string | null;

  @Field()
  timestamp!: Date;
}
