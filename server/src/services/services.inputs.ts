import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty, Length, Matches } from 'class-validator';

@InputType()
export class CreateServiceInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId!: string;

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

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

@InputType()
export class UpdateServiceInput {
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
  @Length(0, 500)
  description?: string;
}
