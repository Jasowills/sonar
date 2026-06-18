import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CheckResultModel {
  @Field()
  id!: string;

  @Field()
  state!: string;

  @Field(() => Int, { nullable: true })
  statusCode?: number | null;

  @Field(() => Int, { nullable: true })
  latencyMs?: number | null;

  @Field(() => String, { nullable: true })
  errorMessage?: string | null;

  @Field()
  checkedAt!: Date;

  @Field()
  monitorId!: string;
}

@ObjectType()
export class CheckResultsConnection {
  @Field(() => [CheckResultModel])
  items!: CheckResultModel[];

  @Field(() => String, { nullable: true })
  nextCursor?: string | null;
}
