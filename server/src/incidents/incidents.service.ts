import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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
      return await this.prisma.incident.create({
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
        },
      });
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

      return await this.prisma.incident.update({
        where: { id: input.id },
        data,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async addUpdate(input: AddIncidentUpdateInput): Promise<IncidentUpdateModel> {
    try {
      const now = new Date();
      return await this.prisma.incidentUpdate.create({
        data: {
          kind: input.kind,
          body: input.body,
          createdAt: now,
          incidentId: input.incidentId,
          actorUserId: input.actorUserId ?? null,
        },
      });
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
}
