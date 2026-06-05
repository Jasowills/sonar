import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../shared/slugify';
import { StatusPageModel } from './models/status-page.model';
import { StatusPageDetailModel } from './models/status-page-detail.model';
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

  async findById(id: string): Promise<StatusPageDetailModel | null> {
    try {
      return await this.buildDetail(id);
    } catch {
      return null;
    }
  }

  async findBySlug(slug: string): Promise<StatusPageDetailModel | null> {
    try {
      const page = await this.prisma.statusPage.findUnique({ where: { slug } });
      if (!page) return null;
      return await this.buildDetail(page.id);
    } catch {
      return null;
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

  private async buildDetail(id: string): Promise<StatusPageDetailModel> {
    const page = await this.prisma.statusPage.findUniqueOrThrow({
      where: { id },
      include: {
        services: {
          include: {
            service: {
              include: {
                monitors: {
                  include: {
                    checkResults: {
                      orderBy: { checkedAt: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return {
      id: page.id,
      name: page.name,
      slug: page.slug,
      headline: page.headline,
      visibility: page.visibility,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      workspaceId: page.workspaceId,
      projectId: page.projectId,
      services: page.services.map((s) => {
        const latestCheck = s.service.monitors[0]?.checkResults[0];
        return {
          id: s.id,
          serviceId: s.serviceId,
          name: s.service.name,
          displayName: s.displayName,
          status: latestCheck?.state ?? 'PENDING',
          latencyMs: latestCheck?.latencyMs ?? null,
          sortOrder: s.sortOrder,
        };
      }),
    };
  }
}
