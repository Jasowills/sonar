import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { StatusPagesService } from './status-pages.service';

const statusMap: Record<string, string> = {
  HEALTHY: 'operational',
  DEGRADED: 'degraded_performance',
  DOWN: 'major_outage',
  PENDING: 'unknown',
};

function computeOverall(services: Array<{ status: string }>): string {
  let hasDown = false;
  let hasDegraded = false;
  for (const s of services) {
    if (s.status === 'DOWN') hasDown = true;
    else if (s.status === 'DEGRADED') hasDegraded = true;
  }
  if (hasDown) return 'major_outage';
  if (hasDegraded) return 'partial_outage';
  return 'operational';
}

@Controller('status')
export class StatusPagesController {
  constructor(private readonly statusPagesService: StatusPagesService) {}

  @Public()
  @Get(':workspaceSlug/:slug')
  async getStatusPage(
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('slug') slug: string,
  ) {
    const detail = await this.statusPagesService.findByWorkspaceAndSlug(
      workspaceSlug,
      slug,
    );
    if (!detail) throw new NotFoundException('Status page not found');

    const overall = computeOverall(detail.services);

    return {
      page: {
        name: detail.name,
        slug: detail.slug,
        headline: detail.headline,
        logoUrl: detail.logoUrl,
        faviconUrl: detail.faviconUrl,
        brandColor: detail.brandColor,
        footerText: detail.footerText,
      },
      overall,
      updatedAt: detail.updatedAt.toISOString(),
      services: detail.services.map((s) => ({
        id: s.id,
        name: s.displayName ?? s.name,
        groupName: s.groupName,
        isVisible: s.isVisible,
        status: statusMap[s.status] ?? 'unknown',
        latencyMs: s.latencyMs,
      })),
    };
  }
}
