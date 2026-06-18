import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../shared/prisma-errors';
import { MonitorModel } from './models/monitor.model';
import { CheckResultModel, CheckResultsConnection } from './models/check-result.model';
import { CreateMonitorInput, UpdateMonitorInput } from './monitors.inputs';

/** The minimum shape needed to render a monitor as a flat view model. */
type MonitorViewSource = {
  id: string;
  name: string;
  targetUrl: string;
  method: string;
  expectedStatus: number;
  intervalSeconds: number;
  timeoutSeconds: number;
  isActive: boolean;
  updatedAt: Date;
  service: { id: string; name: string };
  environment: { id: string; name: string };
  checkResults: Array<{ state: string; latencyMs: number | null }>;
};

const monitorInclude = {
  service: true,
  environment: true,
  checkResults: {
    orderBy: { checkedAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.MonitorInclude;

@Injectable()
export class MonitorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    projectSlug?: string,
    environmentKey?: string,
  ): Promise<MonitorModel[]> {
    try {
      const monitors = await this.prisma.monitor.findMany({
        where: {
          ...(projectSlug
            ? { service: { project: { slug: projectSlug } } }
            : {}),
          ...(environmentKey ? { environment: { key: environmentKey } } : {}),
        },
        include: monitorInclude,
        orderBy: { updatedAt: 'desc' },
      });

      if (monitors.length > 0) {
        return monitors.map((monitor) => this.toView(monitor));
      }
    } catch {
      // noop
    }

    return [];
  }

  async findById(id: string): Promise<MonitorModel | null> {
    try {
      const monitor = await this.prisma.monitor.findUnique({
        where: { id },
        include: {
          service: { include: { project: true } },
          environment: true,
          checkResults: {
            orderBy: { checkedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!monitor) return null;
      return this.toView(monitor);
    } catch {
      return null;
    }
  }

  async getCheckResults(
    monitorId: string,
    limit: number,
    cursor?: string,
  ): Promise<CheckResultsConnection> {
    try {
      const where: Prisma.CheckResultWhereInput = { monitorId };
      if (cursor) {
        where.id = { lt: cursor };
      }

      const results = await this.prisma.checkResult.findMany({
        where,
        orderBy: { checkedAt: 'desc' },
        take: limit + 1,
      });

      const hasMore = results.length > limit;
      const items = hasMore ? results.slice(0, limit) : results;
      const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

      return {
        items: items.map((r) => ({
          id: r.id,
          state: r.state,
          statusCode: r.statusCode,
          latencyMs: r.latencyMs,
          errorMessage: r.errorMessage,
          checkedAt: r.checkedAt,
          monitorId: r.monitorId,
        })),
        nextCursor,
      };
    } catch {
      return { items: [], nextCursor: null };
    }
  }

  async create(input: CreateMonitorInput): Promise<MonitorModel> {
    try {
      const now = new Date();

      const monitor = await this.prisma.monitor.create({
        data: {
          serviceId: input.serviceId,
          environmentId: input.environmentId,
          name: input.name,
          targetUrl: input.targetUrl,
          method: input.method,
          expectedStatus: input.expectedStatus,
          expectedKeyword: input.expectedKeyword,
          intervalSeconds: input.intervalSeconds,
          timeoutSeconds: input.timeoutSeconds,
          createdAt: now,
          updatedAt: now,
        },
        include: monitorInclude,
      });

      return this.toView(monitor);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async update(input: UpdateMonitorInput): Promise<MonitorModel> {
    try {
      const monitor = await this.prisma.monitor.update({
        where: { id: input.id },
        data: {
          name: input.name,
          targetUrl: input.targetUrl,
          method: input.method,
          expectedStatus: input.expectedStatus,
          expectedKeyword: input.expectedKeyword,
          intervalSeconds: input.intervalSeconds,
          timeoutSeconds: input.timeoutSeconds,
          isActive: input.isActive,
          ...(input.serviceId !== undefined ? { serviceId: input.serviceId } : {}),
          ...(input.environmentId !== undefined ? { environmentId: input.environmentId } : {}),
          updatedAt: new Date(),
        },
        include: monitorInclude,
      });

      return this.toView(monitor);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.monitor.delete({ where: { id } });
      return true;
    } catch (error) {
      mapPrismaError(error);
    }
  }

  private toView(monitor: MonitorViewSource): MonitorModel {
    const latestCheck = monitor.checkResults[0];

    return {
      id: monitor.id,
      name: monitor.name,
      targetUrl: monitor.targetUrl,
      method: monitor.method,
      expectedStatus: monitor.expectedStatus,
      intervalSeconds: monitor.intervalSeconds,
      timeoutSeconds: monitor.timeoutSeconds,
      isActive: monitor.isActive,
      serviceId: monitor.service.id,
      serviceName: monitor.service.name,
      environmentId: monitor.environment.id,
      environmentName: monitor.environment.name,
      latestState: latestCheck?.state ?? 'PENDING',
      latestLatencyMs: latestCheck?.latencyMs ?? null,
      updatedAt: monitor.updatedAt,
    };
  }
}
