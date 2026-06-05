import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { IncidentsService } from '../incidents/incidents.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CheckerService {
  private readonly logger = new Logger(CheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly incidents: IncidentsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async tick(): Promise<void> {
    try {
      const due = await this.prisma.monitor.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          targetUrl: true,
          method: true,
          timeoutSeconds: true,
          expectedStatus: true,
          intervalSeconds: true,
          updatedAt: true,
          serviceId: true,
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
      this.logger.debug('Checker tick skipped (DB unavailable)');
    }
  }

  private async check(monitor: {
    id: string;
    name: string;
    targetUrl: string;
    method: string;
    timeoutSeconds: number;
    expectedStatus: number;
    intervalSeconds: number;
    updatedAt: Date;
    serviceId: string;
    checkResults: Array<{ state: string; checkedAt: Date }>;
  }): Promise<void> {
    const startedAt = Date.now();
    const prevState = monitor.checkResults[0]?.state ?? 'PENDING';

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

      await this.recordResult(monitor, state, response.status, latencyMs, null, prevState);
    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.recordResult(monitor, 'DOWN', null, latencyMs, errorMessage, prevState);
    }
  }

  private async recordResult(
    monitor: {
      id: string;
      name: string;
      serviceId: string;
      checkResults: Array<{ state: string; checkedAt: Date }>;
    },
    state: string,
    statusCode: number | null,
    latencyMs: number,
    errorMessage: string | null,
    prevState: string,
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
          monitorId: monitor.id,
        },
      });

      await this.prisma.monitor.update({
        where: { id: monitor.id },
        data: { updatedAt: new Date() },
      });

      if (prevState !== state) {
        if (state === 'DOWN') {
          this.events.emit({
            type: 'monitor_down',
            data: { monitorId: monitor.id, name: monitor.name, errorMessage },
          });
          await this.autoCreateIncident(monitor, 'DOWN', errorMessage);
        } else if (state === 'DEGRADED') {
          this.events.emit({
            type: 'monitor_degraded',
            data: { monitorId: monitor.id, name: monitor.name },
          });
        } else if (state === 'HEALTHY') {
          this.events.emit({
            type: 'monitor_up',
            data: { monitorId: monitor.id, name: monitor.name },
          });
        }
      }
    } catch (err) {
      this.logger.error(`Failed to record check result for monitor ${monitor.id}`, err);
    }
  }

  private async autoCreateIncident(
    monitor: { id: string; name: string; serviceId: string },
    state: string,
    errorMessage: string | null,
  ): Promise<void> {
    try {
      const existing = await this.prisma.incident.findFirst({
        where: { monitorId: monitor.id, status: 'OPEN' },
        select: { id: true },
      });
      if (existing) return;

      const service = await this.prisma.service.findUnique({
        where: { id: monitor.serviceId },
        select: { projectId: true, project: { select: { workspaceId: true } } },
      });
      if (!service) return;

      const severity = state === 'DOWN' ? 'CRITICAL' : 'HIGH';
      const title = `Monitor "${monitor.name}" is ${state.toLowerCase()}`;
      const summary = errorMessage
        ? `Monitor checked failed: ${errorMessage}`
        : `Monitor "${monitor.name}" reported state: ${state}`;

      await this.incidents.create({
        title,
        summary,
        severity,
        workspaceId: service.project.workspaceId,
        projectId: service.projectId,
        monitorId: monitor.id,
        serviceId: monitor.serviceId,
      });
    } catch (err) {
      this.logger.error(`Failed to auto-create incident for monitor ${monitor.id}`, err);
    }
  }
}
