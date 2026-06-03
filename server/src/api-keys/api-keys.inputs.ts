import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

@InputType()
export class CreateApiKeyInput {
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
  expiresAt?: string;
}

@InputType()
export class RevokeApiKeyInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  id!: string;
}