import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { IncidentModel } from './models/incident.model';
import { IncidentUpdateModel } from './models/incident-update.model';
import {
  AddIncidentUpdateInput,
  CreateIncidentInput,
  ResolveIncidentInput,
  UpdateIncidentInput,
} from './incidents.inputs';
import { IncidentsService } from './incidents.service';

@Resolver(() => IncidentModel)
export class IncidentsResolver {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Query(() => [IncidentModel])
  incidents(): Promise<IncidentModel[]> {
    return this.incidentsService.findAll();
  }

  @Query(() => [IncidentUpdateModel])
  incidentUpdates(
    @Args('incidentId') incidentId: string,
  ): Promise<IncidentUpdateModel[]> {
    return this.incidentsService.findUpdates(incidentId);
  }

  @Mutation(() => IncidentModel)
  createIncident(
    @Args('input') input: CreateIncidentInput,
  ): Promise<IncidentModel> {
    return this.incidentsService.create(input);
  }

  @Mutation(() => IncidentModel)
  updateIncident(
    @Args('input') input: UpdateIncidentInput,
  ): Promise<IncidentModel> {
    return this.incidentsService.update(input);
  }

  @Mutation(() => IncidentModel)
  resolveIncident(
    @Args('input') input: ResolveIncidentInput,
  ): Promise<IncidentModel> {
    return this.incidentsService.resolve(input);
  }

  @Mutation(() => IncidentUpdateModel)
  addIncidentUpdate(
    @Args('input') input: AddIncidentUpdateInput,
  ): Promise<IncidentUpdateModel> {
    return this.incidentsService.addUpdate(input);
  }

  @Mutation(() => Boolean)
  deleteIncident(@Args('id') id: string): Promise<boolean> {
    return this.incidentsService.remove(id);
  }
}
