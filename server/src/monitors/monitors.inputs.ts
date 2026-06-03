import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsNotEmpty, IsUrl, Length, Max, Min } from 'class-validator';

@InputType()
export class CreateMonitorInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  environmentId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @Field()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  @IsNotEmpty()
  targetUrl!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsEnum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
  method?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  expectedStatus?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  expectedKeyword?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(3600)
  intervalSeconds?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  timeoutSeconds?: number;
}

@InputType()
export class UpdateMonitorInput {
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
  @IsNotEmpty()
  serviceId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  environmentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  targetUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsEnum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
  method?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  expectedStatus?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  expectedKeyword?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(3600)
  intervalSeconds?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  timeoutSeconds?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
