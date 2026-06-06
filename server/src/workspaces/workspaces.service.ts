import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../shared/prisma-errors';
import { slugify } from '../shared/slugify';
import { CreateWorkspaceInput, UpdateWorkspaceInput } from './workspaces.inputs';

type WorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: string): Promise<WorkspaceRecord[]> {
    try {
      return await this.prisma.workspace.findMany({
        where: userId ? { memberships: { some: { userId } } } : undefined,
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error(`findAll failed for user ${userId}: ${error}`);
      throw error;
    }
  }

  async create(input: CreateWorkspaceInput): Promise<WorkspaceRecord> {
    try {
      const now = new Date();

      return await this.prisma.workspace.create({
        data: {
          name: input.name,
          slug: slugify(input.slug ?? input.name),
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async update(input: UpdateWorkspaceInput): Promise<WorkspaceRecord> {
    try {
      return await this.prisma.workspace.update({
        where: { id: input.id },
        data: { name: input.name, updatedAt: new Date() },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async remove(id: string, userId?: string): Promise<boolean> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: { workspaceId: id, userId },
      });
      if (!membership) {
        throw new Error('Not authorized to delete this workspace');
      }

      await this.prisma.membership.deleteMany({ where: { workspaceId: id } });
      await this.prisma.workspace.delete({ where: { id } });
      return true;
    } catch (error) {
      this.logger.error(`remove failed for workspace ${id} by user ${userId}: ${error}`);
      return false;
    }
  }
}
