import { Module } from '@nestjs/common';

import { ApiKeysModule } from '../api-keys/api-keys.module';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsResolver } from './deployments.resolver';
import { DeploymentsService } from './deployments.service';

@Module({
  imports: [ApiKeysModule],
  controllers: [DeploymentsController],
  providers: [DeploymentsResolver, DeploymentsService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
