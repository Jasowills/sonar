import { Injectable } from '@nestjs/common';
import { MonitorModel } from '../monitors/models/monitor.model';
import { MonitorsService } from '../monitors/monitors.service';
import { PrismaService } from '../prisma/prisma.service';

type OverviewSnapshot = {
  workspaceName: string;
  projectName: string;
  productionMonitorCount: number;
  monitors: MonitorModel[];
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
};

@Injectable()
export class OverviewService {
  constructor(
    private readonly monitorsService: MonitorsService,
    private readonly prisma: PrismaService,
  ) {}

  async getSnapshot(workspaceSlug?: string): Promise<OverviewSnapshot> {
    const monitors: MonitorModel[] = await this.monitorsService.findAll();

    // Compute uptime from last 24h check results
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let uptimePercent = '100.00';
    try {
      const recentChecks = await this.prisma.checkResult.findMany({
        where: {
          checkedAt: { gte: dayAgo },
          monitor: workspaceSlug ? { service: { project: { workspace: { slug: workspaceSlug } } } } : undefined,
        },
        select: { state: true },
      });
      if (recentChecks.length > 0) {
        const healthyCount = recentChecks.filter((c) => c.state === 'HEALTHY').length;
        uptimePercent = ((healthyCount / recentChecks.length) * 100).toFixed(2);
      }
    } catch { /* use default */ }

    // Count open incidents
    let openIncidents = 0;
    try {
      openIncidents = await this.prisma.incident.count({
        where: { status: 'OPEN' },
      });
    } catch { /* use default */ }

    const productionMonitorCount = monitors.filter(
      (monitor) => monitor.environmentName === 'Production',
    ).length;

    const metrics = monitors.length > 0
      ? [
          { label: 'Uptime', value: `${uptimePercent}%`, detail: 'Rolling 24-hour uptime across all checks.' },
          { label: 'Active checks', value: String(monitors.length), detail: 'Enabled monitors sending traffic.' },
          { label: 'Open incidents', value: String(openIncidents), detail: 'Incidents currently in OPEN state.' },
          { label: 'Environments', value: String(new Set(monitors.map((m) => m.environmentName)).size), detail: 'Unique environments with at least one monitor.' },
        ]
      : [];

    return {
      workspaceName: 'Workspace',
      projectName: 'Project',
      productionMonitorCount,
      monitors,
      metrics,
    };
  }
}
