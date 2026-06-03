import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    const gql = GqlExecutionContext.create(context);
    const ctx = gql.getContext();
    if (ctx.req) {
      return { req: ctx.req, res: ctx.req.res };
    }
    return super.getRequestResponse(context);
  }
}
