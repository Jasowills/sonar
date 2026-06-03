import { UnauthorizedException } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthenticatedUser } from '../auth/jwt';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationModel } from './models/notification.model';
import { NotificationsService } from './notifications.service';

@Resolver(() => NotificationModel)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  private requireUser(user: AuthenticatedUser | null): AuthenticatedUser {
    if (!user) throw new UnauthorizedException();
    return user;
  }

  @Query(() => [NotificationModel])
  notifications(
    @CurrentUser() user: AuthenticatedUser | null,
    @Args('workspaceId', { type: () => String, nullable: true })
    workspaceId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<NotificationModel[]> {
    const authed = this.requireUser(user);
    return this.notificationsService.findAll(authed.sub, workspaceId, limit);
  }

  @Query(() => Int)
  unreadNotificationCount(
    @CurrentUser() user: AuthenticatedUser | null,
  ): Promise<number> {
    const authed = this.requireUser(user);
    return this.notificationsService.unreadCount(authed.sub);
  }

  @Mutation(() => Boolean)
  markNotificationRead(
    @CurrentUser() user: AuthenticatedUser | null,
    @Args('id') id: string,
  ): Promise<boolean> {
    this.requireUser(user);
    return this.notificationsService.markRead(id);
  }

  @Mutation(() => Boolean)
  markAllNotificationsRead(
    @CurrentUser() user: AuthenticatedUser | null,
  ): Promise<boolean> {
    const authed = this.requireUser(user);
    return this.notificationsService.markAllRead(authed.sub);
  }
}
