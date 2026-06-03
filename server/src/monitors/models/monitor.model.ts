import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MonitorModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  targetUrl!: string;

  @Field()
  method!: string;

  @Field(() => Int)
  expectedStatus!: number;

  @Field(() => Int)
  intervalSeconds!: number;

  @Field(() => Int)
  timeoutSeconds!: number;

  @Field()
  isActive!: boolean;

  @Field()
  serviceId!: string;

  @Field()
  serviceName!: string;

  @Field()
  environmentId!: string;

  @Field()
  environmentName!: string;

  @Field()
  latestState!: string;

  @Field(() => Int, { nullable: true })
  latestLatencyMs?: number | null;

  @Field()
  updatedAt!: Date;
}
