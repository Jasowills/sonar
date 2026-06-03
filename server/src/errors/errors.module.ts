import { Module } from '@nestjs/common';

import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ErrorsController } from './errors.controller';
import { ErrorsResolver } from './errors.resolver';
import { ErrorsService } from './errors.service';

@Module({
  imports: [ApiKeysModule],
  controllers: [ErrorsController],
  providers: [ErrorsResolver, ErrorsService],
  exports: [ErrorsService],
})
export class ErrorsModule {}
