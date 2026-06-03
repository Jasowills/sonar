import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class IncidentUpdateModel {
  @Field() id!: string;
  @Field() kind!: string;
  @Field() body!: string;
  @Field() createdAt!: Date;
  @Field(() => String, { nullable: true }) actorUserId: string | null;
  @Field() incidentId!: string;
}
