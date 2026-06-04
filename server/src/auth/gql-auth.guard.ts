import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

import type { AuthenticatedUser } from './jwt';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Only apply to GraphQL requests — REST endpoints use ApiKeyGuard or @Public()
    if (context.getType<GqlContextType>() !== 'graphql') {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext<{ user: AuthenticatedUser | null }>().user;
    if (!user) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
