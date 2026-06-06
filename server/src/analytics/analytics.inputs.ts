import { Field, InputType, Int, Float } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty, IsInt, IsBoolean, IsDateString, IsNumber, ArrayNotEmpty } from 'class-validator';

@InputType()
export class AnalyticsEventInput {
  @Field() @IsString() @IsNotEmpty() type!: string;

  @Field({ nullable: true }) @IsOptional() @IsString() category?: string;

  @Field({ nullable: true }) @IsOptional() @IsString() name?: string;

  @Field() @IsString() @IsNotEmpty() url!: string;

  @Field({ nullable: true }) @IsOptional() @IsString() referrer?: string;

  @Field({ nullable: true }) @IsOptional() @IsString() userAgent?: string;

  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() viewportWidth?: number;

  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() viewportHeight?: number;

  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() screenWidth?: number;

  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() screenHeight?: number;

  @Field({ nullable: true }) @IsOptional() @IsString() payload?: string;

  @Field({ nullable: true }) @IsOptional() @IsString() sessionId?: string;

  @Field({ nullable: true }) @IsOptional() @IsString() visitorId?: string;

  @Field({ nullable: true }) @IsOptional() @IsBoolean() consentGranted?: boolean;

  @Field({ nullable: true }) @IsOptional() @IsDateString() timestamp?: string;

  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() severity?: number;

  @Field({ nullable: true }) @IsOptional() @IsString() fingerprint?: string;
}

@InputType()
export class AnalyticsSessionInput {
  @Field({ nullable: true }) @IsOptional() @IsString() visitorId?: string;

  @Field({ nullable: true }) @IsOptional() @IsString() sessionId?: string;

  @Field() @IsString() @IsNotEmpty() startUrl!: string;

  @Field({ nullable: true }) @IsOptional() @IsString() referrer?: string;

  @Field({ nullable: true }) @IsOptional() @IsString() userAgent?: string;

  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() pageViews?: number;

  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() eventCount?: number;

  @Field({ nullable: true }) @IsOptional() @IsBoolean() isBounce?: boolean;
}

@InputType()
export class IngestAnalyticsInput {
  @Field(() => [AnalyticsEventInput]) @ArrayNotEmpty() events!: AnalyticsEventInput[];

  @Field(() => AnalyticsSessionInput, { nullable: true }) @IsOptional() session?: AnalyticsSessionInput;

  @Field({ nullable: true }) @IsOptional() @IsString() projectKey?: string;
}
