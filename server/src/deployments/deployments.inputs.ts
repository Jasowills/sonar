import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty, Length, IsEnum } from 'class-validator';
import { DeploymentStatus } from './models/deployment.model';

@InputType()
export class RecordDeploymentInput {
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
  projectKey?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  version!: string;

  @Field(() => DeploymentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(DeploymentStatus)
  status?: DeploymentStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  deployedBy?: string;
}
