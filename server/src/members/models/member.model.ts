import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MemberUserModel {
  @Field() id!: string;
  @Field() email!: string;
  @Field(() => String, { nullable: true }) fullName?: string | null;
  @Field(() => String, { nullable: true }) avatarUrl?: string | null;
}

@ObjectType()
export class MemberModel {
  @Field() id!: string;
  @Field() role!: string;
  @Field(() => MemberUserModel) user!: MemberUserModel;
}
