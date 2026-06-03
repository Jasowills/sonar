import { Injectable } from '@nestjs/common';

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
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<WorkspaceRecord[]> {
    try {
      return await this.prisma.workspace.findMany({
        orderBy: { createdAt: 'asc' },
      });
    } catch {
      return [];
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

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.membership.deleteMany({ where: { workspaceId: id } });
      await this.prisma.workspace.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
