import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { WorkspaceModel } from './models/workspace.model';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from './workspaces.inputs';
import { WorkspacesService } from './workspaces.service';

@Resolver(() => WorkspaceModel)
export class WorkspacesResolver {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Query(() => [WorkspaceModel])
  workspaces(): Promise<WorkspaceModel[]> {
    return this.workspacesService.findAll();
  }

  @Mutation(() => WorkspaceModel)
  createWorkspace(
    @Args('input') input: CreateWorkspaceInput,
  ): Promise<WorkspaceModel> {
    return this.workspacesService.create(input);
  }

  @Mutation(() => WorkspaceModel)
  updateWorkspace(
    @Args('input') input: UpdateWorkspaceInput,
  ): Promise<WorkspaceModel> {
    return this.workspacesService.update(input);
  }

  @Mutation(() => Boolean)
  deleteWorkspace(@Args('id') id: string): Promise<boolean> {
    return this.workspacesService.remove(id);
  }
}
