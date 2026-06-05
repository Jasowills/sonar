import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ServiceHealthModel {
  @Field(() => ID)
  id: string;

  @Field()
  serviceId: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  displayName: string | null;

  @Field()
  status: string;

  @Field(() => Int, { nullable: true })
  latencyMs: number | null;

  @Field(() => Int)
  sortOrder: number;
}
