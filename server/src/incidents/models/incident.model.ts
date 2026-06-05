import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class IncidentModel {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  summary: string | null;

  @Field()
  severity: string;

  @Field()
  status: string;

  @Field()
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  resolvedAt: Date | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  workspaceId: string;

  @Field()
  projectId: string;

  @Field(() => String, { nullable: true })
  environmentId: string | null;

  @Field(() => String, { nullable: true })
  serviceId: string | null;

  @Field(() => String, { nullable: true })
  ownerUserId: string | null;

  @Field(() => String, { nullable: true })
  monitorId: string | null;
}
