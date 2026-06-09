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
  UpdateStatusPageServiceInput,
} from './status-pages.inputs';

@Injectable()
export class StatusPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<StatusPageModel[]> {
    try {
      const pages = await this.prisma.statusPage.findMany({
        include: { workspace: true },
      });
      return pages.map(this.toModel);
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
      const page = await this.prisma.statusPage.findFirst({ where: { slug } });
      if (!page) return null;
      return await this.buildDetail(page.id);
    } catch {
      return null;
    }
  }

  async findByWorkspaceAndSlug(
    workspaceSlug: string,
    slug: string,
  ): Promise<StatusPageDetailModel | null> {
    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
      });
      if (!workspace) return null;
      const page = await this.prisma.statusPage.findFirst({
        where: { slug, workspaceId: workspace.id },
      });
      if (!page) return null;
      return await this.buildDetail(page.id);
    } catch {
      return null;
    }
  }

  private async ensureUniqueSlug(
    baseSlug: string,
    workspaceId: string,
  ): Promise<string> {
    let candidate = baseSlug;
    let suffix = 1;
    while (
      await this.prisma.statusPage.findFirst({
        where: { slug: candidate, workspaceId },
      })
    ) {
      candidate = `${baseSlug}-${suffix}`;
      suffix++;
    }
    return candidate;
  }

  async create(input: CreateStatusPageInput): Promise<StatusPageModel> {
    const now = new Date();
    try {
      const baseSlug = slugify(input.name);
      const slug = await this.ensureUniqueSlug(baseSlug, input.workspaceId);
      const page = await this.prisma.statusPage.create({
        data: {
          name: input.name,
          slug,
          headline: input.headline ?? null,
          visibility: 'PUBLIC',
          workspaceId: input.workspaceId,
          projectId: input.projectId ?? null,
          createdAt: now,
          updatedAt: now,
        },
        include: { workspace: true },
      });
      return this.toModel(page);
    } catch {
      throw new Error('Failed to create status page');
    }
  }

  async update(input: UpdateStatusPageInput): Promise<StatusPageModel | null> {
    try {
      const existing = await this.prisma.statusPage.findUnique({
        where: { id: input.id },
      });
      if (!existing) return null;

      const data: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) {
        data.name = input.name;
        const baseSlug = slugify(input.name);
        data.slug = await this.ensureUniqueSlug(baseSlug, existing.workspaceId);
      }
      if (input.headline !== undefined) data.headline = input.headline;
      if (input.visibility !== undefined) data.visibility = input.visibility;
      if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl;
      if (input.faviconUrl !== undefined) data.faviconUrl = input.faviconUrl;
      if (input.brandColor !== undefined) data.brandColor = input.brandColor;
      if (input.footerText !== undefined) data.footerText = input.footerText;

      const page = await this.prisma.statusPage.update({
        where: { id: input.id },
        data,
        include: { workspace: true },
      });
      return this.toModel(page);
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
          groupName: input.groupName ?? null,
          isVisible: input.isVisible ?? true,
          statusPageId: input.statusPageId,
          serviceId: input.serviceId,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async updateService(input: UpdateStatusPageServiceInput): Promise<boolean> {
    try {
      const data: Record<string, unknown> = {};
      if (input.displayName !== undefined) data.displayName = input.displayName;
      if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
      if (input.groupName !== undefined) data.groupName = input.groupName;
      if (input.isVisible !== undefined) data.isVisible = input.isVisible;

      await this.prisma.statusPageService.updateMany({
        where: {
          statusPageId: input.statusPageId,
          serviceId: input.serviceId,
        },
        data,
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

  private toModel(page: {
    id: string;
    name: string;
    slug: string;
    headline: string | null;
    visibility: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    brandColor: string | null;
    footerText: string | null;
    createdAt: Date;
    updatedAt: Date;
    workspaceId: string;
    projectId: string | null;
    workspace: { slug: string };
  }): StatusPageModel {
    return {
      id: page.id,
      name: page.name,
      slug: page.slug,
      headline: page.headline,
      visibility: page.visibility,
      logoUrl: page.logoUrl,
      faviconUrl: page.faviconUrl,
      brandColor: page.brandColor,
      footerText: page.footerText,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      workspaceId: page.workspaceId,
      workspaceSlug: page.workspace.slug,
      projectId: page.projectId,
    };
  }

  private async buildDetail(id: string): Promise<StatusPageDetailModel> {
    const page = await this.prisma.statusPage.findUniqueOrThrow({
      where: { id },
      include: {
        workspace: true,
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
      logoUrl: page.logoUrl,
      faviconUrl: page.faviconUrl,
      brandColor: page.brandColor,
      footerText: page.footerText,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      workspaceId: page.workspaceId,
      workspaceSlug: page.workspace.slug,
      projectId: page.projectId,
      services: page.services.map((s) => {
        const latestCheck = s.service.monitors[0]?.checkResults[0];
        return {
          id: s.id,
          serviceId: s.serviceId,
          name: s.service.name,
          displayName: s.displayName,
          groupName: s.groupName,
          isVisible: s.isVisible,
          status: latestCheck?.state ?? 'PENDING',
          latencyMs: latestCheck?.latencyMs ?? null,
          sortOrder: s.sortOrder,
        };
      }),
    };
  }
}
