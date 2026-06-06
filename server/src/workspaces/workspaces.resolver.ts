import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt';
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
  workspaces(@CurrentUser() user: AuthenticatedUser | null): Promise<WorkspaceModel[]> {
    return this.workspacesService.findAll(user?.sub);
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
  async deleteWorkspace(
    @Args('id') id: string,
    @CurrentUser() user: AuthenticatedUser | null,
  ): Promise<boolean> {
    if (!user) throw new UnauthorizedException();
    return this.workspacesService.remove(id, user.sub);
  }
}
