import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateAlertChannelInput {
  @Field()
  @IsString() @IsNotEmpty()
  name!: string;

  @Field()
  @IsString() @IsNotEmpty()
  type!: string;

  @Field()
  @IsString() @IsNotEmpty()
  destination!: string;

  @Field({ nullable: true })
  @IsOptional() @IsString()
  secretRef?: string;

  @Field()
  @IsString() @IsNotEmpty()
  workspaceId!: string;
}

@InputType()
export class UpdateAlertChannelInput {
  @Field()
  @IsString() @IsNotEmpty()
  id!: string;

  @Field({ nullable: true })
  @IsOptional() @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional() @IsString()
  destination?: string;

  @Field({ nullable: true })
  @IsOptional() @IsBoolean()
  isEnabled?: boolean;
}

@InputType()
export class CreateAlertRuleInput {
  @Field() @IsString() @IsNotEmpty() name!: string;
  @Field() @IsString() @IsNotEmpty() triggerType!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() minimumSeverity?: string;
  @Field() @IsString() @IsNotEmpty() workspaceId!: string;
  @Field() @IsString() @IsNotEmpty() alertChannelId!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() projectId?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() environmentId?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() serviceId?: string;
}

@InputType()
export class UpdateAlertRuleInput {
  @Field() @IsString() @IsNotEmpty() id!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() name?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() triggerType?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() minimumSeverity?: string;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isEnabled?: boolean;
  @Field({ nullable: true }) @IsOptional() @IsString() alertChannelId?: string;
}
