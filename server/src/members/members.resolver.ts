import { Args, Query, Resolver } from '@nestjs/graphql';
import { MembersService } from './members.service';
import { MemberModel } from './models/member.model';

@Resolver()
export class MembersResolver {
  constructor(private readonly membersService: MembersService) {}

  @Query(() => [MemberModel])
  members(@Args('workspaceId') workspaceId: string): Promise<MemberModel[]> {
    return this.membersService.findAll(workspaceId);
  }
}
