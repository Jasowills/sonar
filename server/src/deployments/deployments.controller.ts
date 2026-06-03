import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { ApiKeyGuard } from '../auth/api-key.guard';
import { DeploymentModel } from './models/deployment.model';
import { RecordDeploymentInput } from './deployments.inputs';
import { DeploymentsService } from './deployments.service';

/**
 * REST ingestion endpoint so CI pipelines can record a deployment with a
 * simple POST — no GraphQL client needed.
 *
 *   curl -X POST http://localhost:8080/ingest/deployments \
 *     -H 'authorization: Bearer <api-key>' \
 *     -H 'content-type: application/json' \
 *     -d '{"environmentId":"env_production","version":"api@2026.5.21"}'
 */
@Controller('ingest/deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @SkipThrottle()
  @UseGuards(ApiKeyGuard)
  @Post()
  record(@Body() input: RecordDeploymentInput): Promise<DeploymentModel> {
    return this.deploymentsService.record(input);
  }
}
