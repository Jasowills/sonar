import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AiCronService {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyBriefs(): Promise<void> {
    console.log('[AiCron] Generating weekly briefs…');
    const workspaces = await this.prisma.workspace.findMany({
      include: { memberships: { include: { user: true } }, projects: true },
    });

    for (const workspace of workspaces) {
      try {
        await this.generateBriefForWorkspace(workspace.id, workspace.memberships.map((m) => m.userId));
      } catch (error) {
        console.error(`[AiCron] Failed brief for workspace ${workspace.id}:`, error);
      }
    }
  }

  async generateBriefForWorkspace(workspaceId: string, userIds: string[]): Promise<string | null> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [allMonitors, errorCount, sessionCount, deploymentCount] = await Promise.all([
      this.prisma.monitor.findMany({
        where: { service: { project: { workspaceId } } },
        select: { id: true, name: true },
      }),
      this.prisma.errorGroup.count({
        where: { project: { workspaceId }, lastSeenAt: { gte: weekAgo } },
      }),
      this.prisma.analyticsSession.count({
        where: { project: { workspaceId }, startedAt: { gte: weekAgo } },
      }),
      this.prisma.deployment.count({
        where: { environment: { project: { workspaceId } }, deployedAt: { gte: weekAgo } },
      }),
    ]);

    const latestResults = await Promise.all(
      allMonitors.map((m) =>
        this.prisma.checkResult.findFirst({
          where: { monitorId: m.id },
          orderBy: { checkedAt: 'desc' },
          select: { state: true },
        }),
      ),
    );
    const downCount = latestResults.filter((r) => r?.state === 'DOWN').length;
    const degradedCount = latestResults.filter((r) => r?.state === 'DEGRADED').length;

    const prompt = [
      'Generate a concise weekly observability brief for a development team.',
      `Period: past 7 days`,
      `Total monitors: ${allMonitors.length}`,
      `Monitors down: ${downCount}`,
      `Monitors degraded: ${degradedCount}`,
      `Error groups: ${errorCount}`,
      `Analytics sessions: ${sessionCount}`,
      `Deployments: ${deploymentCount}`,
      '',
      'Respond with valid JSON only (no markdown):',
      '{ "title": "brief title", "summary": "2-3 sentence summary of the week", "highlights": ["key highlight 1"], "recommendation": "one action item for the team" }',
    ].join('\n');

    const result = await this.ai.generateJson<{
      title: string;
      summary: string;
      highlights: string[];
      recommendation: string;
    }>(prompt, {
      cacheKey: `weekly-brief-${workspaceId}-${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
      temperature: 0.3,
      maxTokens: 512,
    });

    if (!result?.summary) return null;

    const body = [result.summary]
      .concat(result.highlights ?? [])
      .concat(result.recommendation ? `Recommendation: ${result.recommendation}` : [])
      .join('\n\n');

    for (const userId of userIds) {
      try {
        await this.notifications.create({
          type: 'weekly_brief',
          title: result.title ?? `Weekly Brief`,
          body,
          link: '/app',
          userId,
          workspaceId,
        });
      } catch {
        // skip failed notifications per user
      }
    }

    return result.summary;
  }
}
