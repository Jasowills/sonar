import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty, Length } from 'class-validator';

@InputType()
export class CreateIncidentInput {
  @Field() @IsString() @IsNotEmpty() @Length(1, 200) title!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() summary?: string;
  @Field() @IsString() @IsNotEmpty() severity!: string;
  @Field() @IsString() @IsNotEmpty() workspaceId!: string;
  @Field() @IsString() @IsNotEmpty() projectId!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() environmentId?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() serviceId?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() ownerUserId?: string;
}

@InputType()
export class UpdateIncidentInput {
  @Field() @IsString() @IsNotEmpty() id!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() title?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() summary?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() severity?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() status?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() ownerUserId?: string;
}

@InputType()
export class AddIncidentUpdateInput {
  @Field() @IsString() @IsNotEmpty() incidentId!: string;
  @Field() @IsString() @IsNotEmpty() kind!: string;
  @Field() @IsString() @IsNotEmpty() body!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() actorUserId?: string;
}

@InputType()
export class ResolveIncidentInput {
  @Field() @IsString() @IsNotEmpty() id!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() summary?: string;
}
