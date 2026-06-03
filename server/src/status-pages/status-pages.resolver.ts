import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { StatusPageModel } from './models/status-page.model';
import { StatusPagesService } from './status-pages.service';
import {
  CreateStatusPageInput,
  UpdateStatusPageInput,
  AddStatusPageServiceInput,
  RemoveStatusPageServiceInput,
} from './status-pages.inputs';

@Resolver(() => StatusPageModel)
export class StatusPagesResolver {
  constructor(private readonly statusPagesService: StatusPagesService) {}

  @Query(() => [StatusPageModel])
  statusPages(): Promise<StatusPageModel[]> {
    return this.statusPagesService.findAll();
  }

  @Mutation(() => StatusPageModel)
  createStatusPage(
    @Args('input') input: CreateStatusPageInput,
  ): Promise<StatusPageModel> {
    return this.statusPagesService.create(input);
  }

  @Mutation(() => StatusPageModel)
  updateStatusPage(
    @Args('input') input: UpdateStatusPageInput,
  ): Promise<StatusPageModel | null> {
    return this.statusPagesService.update(input);
  }

  @Mutation(() => Boolean)
  deleteStatusPage(@Args('id') id: string): Promise<boolean> {
    return this.statusPagesService.delete(id);
  }

  @Mutation(() => Boolean)
  addStatusPageService(
    @Args('input') input: AddStatusPageServiceInput,
  ): Promise<boolean> {
    return this.statusPagesService.addService(input);
  }

  @Mutation(() => Boolean)
  removeStatusPageService(
    @Args('input') input: RemoveStatusPageServiceInput,
  ): Promise<boolean> {
    return this.statusPagesService.removeService(input);
  }
}
