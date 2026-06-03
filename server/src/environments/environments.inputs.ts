import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty, Length, Matches } from 'class-validator';

@InputType()
export class CreateEnvironmentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_-]+$/, { message: 'key must contain only lowercase letters, numbers, underscores, and hyphens' })
  key!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  color?: string;
}

@InputType()
export class UpdateEnvironmentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  color?: string;
}
