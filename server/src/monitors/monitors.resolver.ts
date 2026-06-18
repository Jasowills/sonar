import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { MonitorModel } from './models/monitor.model';
import { CheckResultModel, CheckResultsConnection } from './models/check-result.model';
import { CreateMonitorInput, UpdateMonitorInput } from './monitors.inputs';
import { MonitorsService } from './monitors.service';

@Resolver(() => MonitorModel)
export class MonitorsResolver {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Query(() => [MonitorModel])
  monitors(
    @Args('projectSlug', { type: () => String, nullable: true })
    projectSlug?: string,
    @Args('environmentKey', { type: () => String, nullable: true })
    environmentKey?: string,
  ): Promise<MonitorModel[]> {
    return this.monitorsService.findAll(projectSlug, environmentKey);
  }

  @Query(() => MonitorModel, { nullable: true })
  monitor(
    @Args('id', { type: () => String }) id: string,
  ): Promise<MonitorModel | null> {
    return this.monitorsService.findById(id);
  }

  @Query(() => CheckResultsConnection)
  checkResults(
    @Args('monitorId', { type: () => String }) monitorId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
  ): Promise<CheckResultsConnection> {
    return this.monitorsService.getCheckResults(monitorId, limit ?? 50, cursor);
  }

  @Mutation(() => MonitorModel)
  createMonitor(
    @Args('input') input: CreateMonitorInput,
  ): Promise<MonitorModel> {
    return this.monitorsService.create(input);
  }

  @Mutation(() => MonitorModel)
  updateMonitor(
    @Args('input') input: UpdateMonitorInput,
  ): Promise<MonitorModel> {
    return this.monitorsService.update(input);
  }

  @Mutation(() => Boolean)
  deleteMonitor(@Args('id') id: string): Promise<boolean> {
    return this.monitorsService.remove(id);
  }
}
