import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum DeploymentStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

registerEnumType(DeploymentStatus, {
  name: 'DeploymentStatus',
  description: 'Lifecycle state of a recorded deployment.',
});

@ObjectType()
export class DeploymentModel {
  @Field()
  id!: string;

  @Field()
  version!: string;

  @Field(() => DeploymentStatus)
  status!: DeploymentStatus;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  deployedBy?: string | null;

  @Field()
  deployedAt!: Date;

  @Field()
  environmentName!: string;

  @Field(() => String, { nullable: true })
  serviceName?: string | null;
}

@ObjectType()
export class DeploymentsConnection {
  @Field(() => [DeploymentModel])
  items!: DeploymentModel[];

  @Field(() => String, { nullable: true })
  nextCursor?: string | null;
}
