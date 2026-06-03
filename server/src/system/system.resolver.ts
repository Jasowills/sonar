import { Query, Resolver } from '@nestjs/graphql';

import { Public } from '../auth/public.decorator';
import { PlatformOverview } from './models/platform-overview.model';

@Resolver(() => PlatformOverview)
export class SystemResolver {
  @Public()
  @Query(() => PlatformOverview)
  platformOverview(): PlatformOverview {
    return {
      name: 'Watchdog API',
      stage: process.env.NODE_ENV ?? 'development',
      graphPath: '/graphql',
      checkedAt: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(2)),
    };
  }
}
