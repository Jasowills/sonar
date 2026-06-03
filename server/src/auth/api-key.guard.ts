import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const apiKey =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const projectId = await this.apiKeysService.resolve(apiKey);
    if (!projectId) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    (request as Request & { projectId?: string }).projectId = projectId;
    return true;
  }
}
