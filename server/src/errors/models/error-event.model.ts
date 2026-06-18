import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ErrorEventModel {
  @Field()
  id!: string;

  @Field()
  eventKey!: string;

  @Field()
  message!: string;

  @Field(() => String, { nullable: true })
  stack?: string | null;

  @Field(() => String, { nullable: true })
  release?: string | null;

  @Field(() => String, { nullable: true })
  metadata?: string | null;

  @Field()
  occurredAt!: Date;

  @Field()
  errorGroupId!: string;
}

@ObjectType()
export class ErrorEventsConnection {
  @Field(() => [ErrorEventModel])
  items!: ErrorEventModel[];

  @Field(() => String, { nullable: true })
  nextCursor?: string | null;
}
