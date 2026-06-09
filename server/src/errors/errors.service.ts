import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'node:crypto';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { mapPrismaError } from '../shared/prisma-errors';
import { fallbackErrorGroups } from '../shared/fallback-data';
import { ErrorEventModel } from './models/error-event.model';
import { ErrorGroupModel, ErrorGroupStatus } from './models/error-group.model';
import { RecordErrorInput } from './errors.inputs';

const ERROR_STATUSES = ['OPEN', 'RESOLVED', 'IGNORED'] as const;

type ErrorGroupViewSource = {
  id: string;
  fingerprint: string;
  title: string;
  status: string;
  occurrenceCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  projectId: string;
  environmentId: string;
  serviceId: string | null;
  environment: { name: string };
  service: { name: string } | null;
};

type FindParams = {
  projectSlug?: string;
  environmentKey?: string;
  serviceId?: string;
  limit?: number;
};

@Injectable()
export class ErrorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(params: FindParams): Promise<ErrorGroupModel[]> {
    const limit = params.limit ?? 20;

    try {
      const where: Prisma.ErrorGroupWhereInput = {};

      if (params.environmentKey) {
        where.environment = { key: params.environmentKey };
      }
      if (params.projectSlug) {
        where.project = { slug: params.projectSlug };
      }
      if (params.serviceId) {
        where.serviceId = params.serviceId;
      }

      const groups = await this.prisma.errorGroup.findMany({
        where,
        include: { environment: true, service: true },
        orderBy: { lastSeenAt: 'desc' },
        take: limit,
      });

      if (groups.length > 0) {
        return groups.map((g) => this.toView(g));
      }
    } catch {
      // noop
    }

    return [];
  }

  async findByFingerprint(
    fingerprint: string,
    environmentId: string,
  ): Promise<ErrorGroupModel | null> {
    try {
      const group = await this.prisma.errorGroup.findFirst({
        where: { fingerprint, environmentId },
        include: { environment: true, service: true },
      });
      return group ? this.toView(group) : null;
    } catch {
      return null;
    }
  }

  async record(input: RecordErrorInput, projectId?: string): Promise<ErrorGroupModel> {
    const fingerprint = input.fingerprint.trim();
    const now = new Date();

    if (!projectId) {
      if (input.projectKey) {
        const project = await this.prisma.project
          .findFirst({ where: { slug: input.projectKey }, select: { id: true } })
          .catch(() => null);
        if (project) {
          projectId = project.id;
        }
      } else if (input.projectId) {
        projectId = input.projectId;
      }
    }

    let environmentId = input.environmentId;
    if (!environmentId && input.environmentKey && projectId) {
      const env = await this.prisma.environment
        .findFirst({
          where: { key: input.environmentKey, projectId },
          select: { id: true },
        })
        .catch(() => null);
      if (env) {
        environmentId = env.id;
      }
    }

    if (!projectId || !environmentId) {
      throw new HttpException(
        'projectId and environmentId (or environmentKey) are required',
        400,
      );
    }

    try {
      const existing = await this.prisma.errorGroup.findFirst({
        where: { fingerprint, environmentId },
        include: { environment: true, service: true },
      });

      if (existing) {
        const group = await this.prisma.errorGroup.update({
          where: { id: existing.id },
          data: {
            lastSeenAt: now,
            occurrenceCount: existing.occurrenceCount + 1,
            updatedAt: now,
          },
          include: { environment: true, service: true },
        });

        await this.appendEvent(group.id, input, now);

        this.emitErrorEvent(group.id, input.message, projectId);

        return this.toView(group);
      }

      const group = await this.prisma.errorGroup.create({
        data: {
          fingerprint,
          title: input.message,
          status: 'OPEN',
          firstSeenAt: now,
          lastSeenAt: now,
          occurrenceCount: 1,
          projectId,
          environmentId,
          serviceId: input.serviceId ?? null,
          createdAt: now,
          updatedAt: now,
        },
        include: { environment: true, service: true },
      });

      await this.appendEvent(group.id, input, now);

      this.emitErrorEvent(group.id, input.message, projectId);

      return this.toView(group);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  private emitErrorEvent(errorGroupId: string, title: string, projectId?: string) {
    this.events.emit({
      type: 'error_created',
      data: { errorGroupId, title },
    });

    if (projectId) {
      this.createErrorNotifications(title, projectId).catch(() => {
        // notifications are best-effort
      });
    }
  }

  private async createErrorNotifications(title: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });
    if (!project) {
      console.warn(`[ErrorsService] createErrorNotifications: project ${projectId} not found`);
      return;
    }

    const memberships = await this.prisma.membership.findMany({
      where: { workspaceId: project.workspaceId },
      select: { userId: true },
    });
    for (const m of memberships) {
      try {
        await this.notifications.create({
          type: 'error_created',
          title: 'New Error',
          body: title,
          link: `/app/errors`,
          userId: m.userId,
          workspaceId: project.workspaceId,
        });
      } catch (err) {
        console.error(`[ErrorsService] failed to create notification for user ${m.userId}:`, err);
      }
    }
  }

  private async appendEvent(
    errorGroupId: string,
    input: RecordErrorInput,
    now: Date,
  ): Promise<void> {
    const raw = `${errorGroupId}:${input.fingerprint}:${now.getTime()}`;
    const eventKey = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24);

    await this.prisma.errorEvent.create({
      data: {
        eventKey,
        message: input.message,
        stack: input.stack ?? null,
        release: input.release ?? null,
        metadata: input.metadata ?? null,
        occurredAt: now,
        createdAt: now,
        errorGroupId,
      },
    });
  }

  async updateStatus(id: string, status: string): Promise<ErrorGroupModel | null> {
    try {
      const group = await this.prisma.errorGroup.update({
        where: { id },
        data: { status, updatedAt: new Date() },
        include: { environment: true, service: true },
      });
      return this.toView(group);
    } catch {
      return null;
    }
  }

  async findEvents(groupId: string): Promise<ErrorEventModel[]> {
    try {
      const events = await this.prisma.errorEvent.findMany({
        where: { errorGroupId: groupId },
        orderBy: { occurredAt: 'desc' },
      });
      return events.map((e) => ({
        id: e.id,
        eventKey: e.eventKey,
        message: e.message,
        stack: e.stack,
        release: e.release,
        metadata: e.metadata !== null && e.metadata !== undefined ? String(e.metadata) : null,
        occurredAt: e.occurredAt,
        errorGroupId: e.errorGroupId,
      }));
    } catch {
      return [];
    }
  }

  private normalizeStatus(status?: string | null): ErrorGroupStatus {
    return ERROR_STATUSES.includes(
      status as (typeof ERROR_STATUSES)[number],
    )
      ? (status as ErrorGroupStatus)
      : ErrorGroupStatus.OPEN;
  }

  private toView(group: ErrorGroupViewSource): ErrorGroupModel {
    return {
      id: group.id,
      fingerprint: group.fingerprint,
      title: group.title,
      status: this.normalizeStatus(group.status),
      occurrenceCount: group.occurrenceCount,
      firstSeenAt: group.firstSeenAt,
      lastSeenAt: group.lastSeenAt,
      projectId: group.projectId,
      environmentId: group.environmentId,
      serviceId: group.serviceId,
      environmentName: group.environment.name,
      serviceName: group.service?.name ?? null,
    };
  }
}
