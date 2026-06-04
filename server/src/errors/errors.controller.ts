import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';

import { ApiKeyGuard } from '../auth/api-key.guard';
import { ErrorGroupModel } from './models/error-group.model';
import { RecordErrorInput } from './errors.inputs';
import { ErrorsService } from './errors.service';

/**
 * REST ingestion endpoint so any application can record an error with a
 * simple POST — no GraphQL client needed.
 *
 *   curl -X POST http://localhost:8080/ingest/errors \
 *     -H 'authorization: Bearer <api-key>' \
 *     -H 'content-type: application/json' \
 *     -d '{"fingerprint":"checkout:TypeError:cart","message":"Cannot read properties of undefined","environmentKey":"production"}'
 */
@Controller('ingest/errors')
export class ErrorsController {
  constructor(private readonly errorsService: ErrorsService) {}

  @SkipThrottle()
  @UseGuards(ApiKeyGuard)
  @Post()
  record(
    @Body() input: RecordErrorInput,
    @Req() req: Request,
  ): Promise<ErrorGroupModel> {
    return this.errorsService.record(input, req.projectId!);
  }
}
