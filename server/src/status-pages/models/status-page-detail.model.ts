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

  @Field(() => String, { nullable: true })
  logoUrl: string | null;

  @Field(() => String, { nullable: true })
  faviconUrl: string | null;

  @Field(() => String, { nullable: true })
  brandColor: string | null;

  @Field(() => String, { nullable: true })
  footerText: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  workspaceId: string;

  @Field()
  workspaceSlug: string;

  @Field(() => String, { nullable: true })
  projectId: string | null;

  @Field(() => [ServiceHealthModel])
  services: ServiceHealthModel[];
}
