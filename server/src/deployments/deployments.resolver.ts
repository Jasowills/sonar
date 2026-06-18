import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { DeploymentModel, DeploymentsConnection } from './models/deployment.model';
import { RecordDeploymentInput } from './deployments.inputs';
import { DeploymentsService } from './deployments.service';

@Resolver(() => DeploymentModel)
export class DeploymentsResolver {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Query(() => DeploymentsConnection)
  deployments(
    @Args('environmentKey', { type: () => String, nullable: true })
    environmentKey?: string,
    @Args('projectSlug', { type: () => String, nullable: true })
    projectSlug?: string,
    @Args('limit', { type: () => Int, nullable: true })
    limit?: number,
    @Args('cursor', { type: () => String, nullable: true })
    cursor?: string,
  ): Promise<DeploymentsConnection> {
    return this.deploymentsService.findAll({
      environmentKey,
      projectSlug,
      limit,
      cursor,
    });
  }

  @Mutation(() => DeploymentModel)
  recordDeployment(
    @Args('input') input: RecordDeploymentInput,
  ): Promise<DeploymentModel> {
    return this.deploymentsService.record(input);
  }
}
