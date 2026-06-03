import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../shared/slugify';
import { StatusPageModel } from './models/status-page.model';
import {
  CreateStatusPageInput,
  UpdateStatusPageInput,
  AddStatusPageServiceInput,
  RemoveStatusPageServiceInput,
} from './status-pages.inputs';

@Injectable()
export class StatusPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<StatusPageModel[]> {
    try {
      return await this.prisma.statusPage.findMany();
    } catch {
      return [];
    }
  }

  async create(input: CreateStatusPageInput): Promise<StatusPageModel> {
    const now = new Date();
    try {
      return await this.prisma.statusPage.create({
        data: {
          name: input.name,
          slug: slugify(input.name),
          headline: input.headline ?? null,
          visibility: 'PUBLIC',
          workspaceId: input.workspaceId,
          projectId: input.projectId ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch {
      throw new Error('Failed to create status page');
    }
  }

  async update(input: UpdateStatusPageInput): Promise<StatusPageModel | null> {
    try {
      const data: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) {
        data.name = input.name;
        data.slug = slugify(input.name);
      }
      if (input.headline !== undefined) data.headline = input.headline;
      if (input.visibility !== undefined) data.visibility = input.visibility;

      return await this.prisma.statusPage.update({
        where: { id: input.id },
        data,
      });
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.statusPage.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async addService(input: AddStatusPageServiceInput): Promise<boolean> {
    try {
      await this.prisma.statusPageService.create({
        data: {
          displayName: input.displayName ?? null,
          sortOrder: input.sortOrder ?? 0,
          statusPageId: input.statusPageId,
          serviceId: input.serviceId,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async removeService(input: RemoveStatusPageServiceInput): Promise<boolean> {
    try {
      await this.prisma.statusPageService.deleteMany({
        where: {
          statusPageId: input.statusPageId,
          serviceId: input.serviceId,
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
