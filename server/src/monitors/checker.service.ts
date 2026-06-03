import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckerService {
  private readonly logger = new Logger(CheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async tick(): Promise<void> {
    try {
      const due = await this.prisma.monitor.findMany({
        where: { isActive: true },
        select: {
          id: true,
          targetUrl: true,
          method: true,
          timeoutSeconds: true,
          expectedStatus: true,
          intervalSeconds: true,
          updatedAt: true,
          checkResults: {
            orderBy: { checkedAt: 'desc' },
            take: 1,
            select: { state: true, checkedAt: true },
          },
        },
      });

      const now = Date.now();

      for (const monitor of due) {
        const lastCheck = monitor.checkResults[0];
        const elapsed = lastCheck
          ? (now - lastCheck.checkedAt.getTime()) / 1000
          : Infinity;

        if (elapsed < monitor.intervalSeconds) continue;

        void this.check(monitor);
      }
    } catch (err) {
      this.logger.error('Checker tick failed', err);
    }
  }

  private async check(monitor: {
    id: string;
    targetUrl: string;
    method: string;
    timeoutSeconds: number;
    expectedStatus: number;
  }): Promise<void> {
    const startedAt = Date.now();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), monitor.timeoutSeconds * 1000);

      const response = await fetch(monitor.targetUrl, {
        method: monitor.method,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const latencyMs = Date.now() - startedAt;
      const state = response.status === monitor.expectedStatus ? 'HEALTHY' : 'DEGRADED';

      await this.recordResult(monitor.id, state, response.status, latencyMs, null);
    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.recordResult(monitor.id, 'DOWN', null, latencyMs, errorMessage);
    }
  }

  private async recordResult(
    monitorId: string,
    state: string,
    statusCode: number | null,
    latencyMs: number,
    errorMessage: string | null,
  ): Promise<void> {
    try {
      const now = new Date();

      await this.prisma.checkResult.create({
        data: {
          state,
          statusCode,
          latencyMs,
          errorMessage,
          checkedAt: now,
          monitorId,
        },
      });

      await this.prisma.monitor.update({
        where: { id: monitorId },
        data: { updatedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`Failed to record check result for monitor ${monitorId}`, err);
    }
  }
}
