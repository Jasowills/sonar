import { Field, Float, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum HealthTrendDirection {
  IMPROVING = 'IMPROVING',
  DECLINING = 'DECLINING',
  STABLE = 'STABLE',
}

registerEnumType(HealthTrendDirection, { name: 'HealthTrendDirection' });

export enum InsightSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

registerEnumType(InsightSeverity, { name: 'InsightSeverity' });

@ObjectType()
export class AIErrorSummary {
  @Field()
  errorGroupId!: string;

  @Field()
  summary!: string;

  @Field(() => String, { nullable: true })
  suggestedFix?: string | null;

  @Field(() => Float, { nullable: true })
  confidence?: number | null;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class DeploymentRef {
  @Field()
  id!: string;

  @Field()
  version!: string;

  @Field()
  environmentName!: string;

  @Field(() => String, { nullable: true })
  serviceName?: string | null;

  @Field()
  deployedAt!: Date;

  @Field()
  deployedBy!: string;
}

@ObjectType()
export class IncidentCorrelation {
  @Field()
  incidentId!: string;

  @Field()
  narrative!: string;

  @Field(() => [DeploymentRef])
  relatedDeployments!: DeploymentRef[];

  @Field(() => [String], { nullable: true })
  relatedErrorGroups?: string[] | null;
}

@ObjectType()
export class HealthTrend {
  @Field()
  monitorId!: string;

  @Field(() => HealthTrendDirection)
  trend!: HealthTrendDirection;

  @Field(() => Float)
  slope!: number;

  @Field(() => Float, { nullable: true })
  avgLatencyMs?: number | null;

  @Field(() => Float, { nullable: true })
  failureRate?: number | null;

  @Field(() => Float, { nullable: true })
  projectedHoursToCritical?: number | null;

  @Field(() => Float, { nullable: true })
  confidence?: number | null;

  @Field(() => Int, { nullable: true })
  dataPoints?: number | null;

  @Field()
  analyzedAt!: Date;
}

@ObjectType()
export class AISessionInsight {
  @Field()
  sessionId!: string;

  @Field()
  summary!: string;

  @Field(() => [String])
  keyMoments!: string[];

  @Field(() => [String])
  frustrationHotspots!: string[];

  @Field(() => String, { nullable: true })
  recommendation?: string | null;
}

@ObjectType()
export class AIAnalyticsInsight {
  @Field()
  title!: string;

  @Field()
  description!: string;

  @Field(() => InsightSeverity)
  severity!: InsightSeverity;

  @Field(() => String, { nullable: true })
  metric?: string | null;

  @Field(() => Float, { nullable: true })
  value?: number | null;
}

@ObjectType()
export class IncidentRootCause {
  @Field()
  incidentId!: string;

  @Field()
  narrative!: string;

  @Field(() => [String])
  possibleCauses!: string[];

  @Field(() => [String])
  suggestions!: string[];

  @Field(() => String, { nullable: true })
  relatedDeploymentId?: string | null;
}

@ObjectType()
export class AnalyticsReport {
  @Field()
  workspaceId!: string;

  @Field()
  executiveSummary!: string;

  @Field(() => [String])
  trafficInsights!: string[];

  @Field(() => [String])
  behaviorInsights!: string[];

  @Field(() => [String])
  frustrationHotspots!: string[];

  @Field(() => [String])
  recommendations!: string[];

  @Field()
  periodLabel!: string;

  @Field()
  analyzedAt!: Date;
}

@ObjectType()
export class AlertTriage {
  @Field()
  alertRuleId!: string;

  @Field(() => String, { nullable: true })
  context?: string | null;

  @Field(() => String, { nullable: true })
  frequency?: string | null;

  @Field(() => String, { nullable: true })
  suggestion?: string | null;
}
