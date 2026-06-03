import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty, IsInt, Length } from 'class-validator';

@InputType()
export class CreateStatusPageInput {
  @Field() @IsString() @IsNotEmpty() @Length(1, 100) name!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @Length(1, 200) headline?: string;
  @Field() @IsString() @IsNotEmpty() workspaceId!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() projectId?: string;
}

@InputType()
export class UpdateStatusPageInput {
  @Field() @IsString() @IsNotEmpty() id!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() name?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() headline?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() visibility?: string;
}

@InputType()
export class AddStatusPageServiceInput {
  @Field() @IsString() @IsNotEmpty() statusPageId!: string;
  @Field() @IsString() @IsNotEmpty() serviceId!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() displayName?: string;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() sortOrder?: number;
}

@InputType()
export class RemoveStatusPageServiceInput {
  @Field() @IsString() @IsNotEmpty() statusPageId!: string;
  @Field() @IsString() @IsNotEmpty() serviceId!: string;
}
