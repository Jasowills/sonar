import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty, Length } from 'class-validator';

@InputType()
export class UpdateErrorGroupStatusInput {
  @Field() @IsString() @IsNotEmpty() id!: string;
  @Field() @IsString() @IsNotEmpty() status!: string;
}

@InputType()
export class RecordErrorInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  fingerprint!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  message!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 10000)
  stack?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  release?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  environmentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  environmentKey?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  projectId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  projectKey?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  metadata?: string;
}
