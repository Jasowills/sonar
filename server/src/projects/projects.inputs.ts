import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty, Length, Matches } from 'class-validator';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must contain only lowercase letters, numbers, and hyphens' })
  slug?: string;
}

@InputType()
export class UpdateProjectInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;
}
