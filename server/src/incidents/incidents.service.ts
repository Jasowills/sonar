import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { mapPrismaError } from '../shared/prisma-errors';
import { IncidentModel } from './models/incident.model';
import { IncidentUpdateModel } from './models/incident-update.model';
import {
  AddIncidentUpdateInput,
  CreateIncidentInput,
  ResolveIncidentInput,
  UpdateIncidentInput,
} from './incidents.inputs';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(): Promise<IncidentModel[]> {
    try {
      return await this.prisma.incident.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return [];
    }
  }

  async create(input: CreateIncidentInput): Promise<IncidentModel> {
    try {
      const now = new Date();
      const incident = await this.prisma.incident.create({
        data: {
          title: input.title,
          summary: input.summary ?? null,
          severity: input.severity,
          status: 'OPEN',
          startedAt: now,
          createdAt: now,
          updatedAt: now,
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          environmentId: input.environmentId ?? null,
          serviceId: input.serviceId ?? null,
          ownerUserId: input.ownerUserId ?? null,
          monitorId: input.monitorId ?? null,
        },
      });

      this.events.emit({
        type: 'incident_created',
        data: { incidentId: incident.id, title: incident.title, severity: incident.severity },
      });

      this.notifyWorkspace(input.workspaceId, 'incident_created', 'Incident Created', incident.title, `/app/incidents`).catch(() => {});

      return incident;
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async update(input: UpdateIncidentInput): Promise<IncidentModel> {
    try {
      const data: Record<string, unknown> = { updatedAt: new Date() };
      if (input.title !== undefined) data.title = input.title;
      if (input.summary !== undefined) data.summary = input.summary;
      if (input.severity !== undefined) data.severity = input.severity;
      if (input.status !== undefined) data.status = input.status;
      if (input.ownerUserId !== undefined) data.ownerUserId = input.ownerUserId;

      return await this.prisma.incident.update({
        where: { id: input.id },
        data,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async resolve(input: ResolveIncidentInput): Promise<IncidentModel> {
    try {
      const data: Record<string, unknown> = {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        updatedAt: new Date(),
      };
      if (input.summary !== undefined) data.summary = input.summary;

      const incident = await this.prisma.incident.update({
        where: { id: input.id },
        data,
      });

      this.events.emit({
        type: 'incident_resolved',
        data: { incidentId: incident.id, title: incident.title },
      });

      this.notifyWorkspace(incident.workspaceId, 'incident_resolved', 'Incident Resolved', incident.title, `/app/incidents`).catch(() => {});

      return incident;
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async addUpdate(input: AddIncidentUpdateInput): Promise<IncidentUpdateModel> {
    try {
      const now = new Date();
      const update = await this.prisma.incidentUpdate.create({
        data: {
          kind: input.kind,
          body: input.body,
          createdAt: now,
          incidentId: input.incidentId,
          actorUserId: input.actorUserId ?? null,
        },
      });

      this.events.emit({
        type: 'incident_update',
        data: { incidentId: input.incidentId, kind: input.kind, body: input.body, updateId: update.id },
      });

      return update;
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.incidentUpdate.deleteMany({ where: { incidentId: id } });
      await this.prisma.incident.delete({ where: { id } });
      return true;
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async findUpdates(incidentId: string): Promise<IncidentUpdateModel[]> {
    try {
      return await this.prisma.incidentUpdate.findMany({
        where: { incidentId },
        orderBy: { createdAt: 'asc' },
      });
    } catch {
      return [];
    }
  }

  private async notifyWorkspace(workspaceId: string, type: string, title: string, body: string, link: string) {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: { workspaceId },
        select: { userId: true },
      });
      for (const m of memberships) {
        try {
          await this.notifications.create({ type, title, body, link, userId: m.userId, workspaceId });
        } catch {
          // per-user notification failure is non-critical
        }
      }
    } catch {
      // workspace member lookup failure is non-critical
    }
  }
}
