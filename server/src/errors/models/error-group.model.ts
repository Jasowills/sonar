import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ErrorGroupStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED',
}

registerEnumType(ErrorGroupStatus, {
  name: 'ErrorGroupStatus',
  description: 'Lifecycle state of a grouped error fingerprint.',
});

@ObjectType()
export class ErrorGroupModel {
  @Field()
  id!: string;

  @Field()
  fingerprint!: string;

  @Field()
  title!: string;

  @Field(() => ErrorGroupStatus)
  status!: ErrorGroupStatus;

  @Field()
  occurrenceCount!: number;

  @Field()
  firstSeenAt!: Date;

  @Field()
  lastSeenAt!: Date;

  @Field()
  projectId!: string;

  @Field()
  environmentId!: string;

  @Field(() => String, { nullable: true })
  serviceId?: string | null;

  @Field()
  environmentName!: string;

  @Field(() => String, { nullable: true })
  serviceName?: string | null;
}

@ObjectType()
export class ErrorGroupsConnection {
  @Field(() => [ErrorGroupModel])
  items!: ErrorGroupModel[];

  @Field(() => String, { nullable: true })
  nextCursor?: string | null;
}
