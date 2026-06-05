import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ServiceHealthModel } from './service-health.model';

@ObjectType()
export class StatusPageDetailModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => String, { nullable: true })
  headline: string | null;

  @Field()
  visibility: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  workspaceId: string;

  @Field(() => String, { nullable: true })
  projectId: string | null;

  @Field(() => [ServiceHealthModel])
  services: ServiceHealthModel[];
}
