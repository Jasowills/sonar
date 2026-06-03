import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../shared/prisma-errors';
import { CreateApiKeyInput, RevokeApiKeyInput } from './api-keys.inputs';
import { ApiKeyModel } from './models/api-key.model';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string): Promise<ApiKeyModel[]> {
    try {
      const keys = await this.prisma.apiKey.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
      if (keys.length > 0) return keys;
    } catch {
      // noop
    }
    return [];
  }

  async create(
    input: CreateApiKeyInput,
    userId?: string,
  ): Promise<ApiKeyModel & { key: string }> {
    const prefix = `wdp_${randomBytes(4).toString('hex')}`;
    const secret = randomBytes(24).toString('hex');
    const key = `${prefix}_${secret}`;
    const keyHash = hashKey(key);
    const now = new Date();

    try {
      const record = await this.prisma.apiKey.create({
        data: {
          name: input.name,
          keyHash,
          prefix,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          createdAt: now,
          updatedAt: now,
          projectId: input.projectId,
          createdByUserId: userId ?? null,
        },
      });

      return { ...record, key };
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async revoke(input: RevokeApiKeyInput): Promise<ApiKeyModel> {
    try {
      const existing = await this.prisma.apiKey.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw new NotFoundException('API key not found');
      }

      return await this.prisma.apiKey.update({
        where: { id: input.id },
        data: { isRevoked: true, updatedAt: new Date() },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async resolve(key: string): Promise<string | null> {
    try {
      const keyHash = hashKey(key);
      const record = await this.prisma.apiKey.findUnique({ where: { keyHash } });
      if (!record || record.isRevoked) {
        this.logger.warn(`API key lookup failed: ${record ? 'revoked' : 'not found'} (prefix: ${key.slice(0, 12)}...)`);
        return null;
      }
      if (record.expiresAt && record.expiresAt < new Date()) {
        this.logger.warn(`API key expired: ${record.expiresAt.toISOString()}`);
        return null;
      }
      return record.projectId;
    } catch (err) {
      this.logger.error(`API key lookup threw: ${err}`);
      return null;
    }
  }
}
