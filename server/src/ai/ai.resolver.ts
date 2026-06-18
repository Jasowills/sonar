import { Args, Float, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AiService } from './ai.service';
import { AiCronService } from './ai.cron.service';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import {
  AIErrorSummary,
  AIAnalyticsInsight,
  AISessionInsight,
  AlertTriage,
  AnalyticsReport,
  DeploymentRef,
  HealthTrend,
  HealthTrendDirection,
  IncidentCorrelation,
  IncidentRootCause,
  InsightSeverity,
} from './ai.models';

@Resolver()
export class AiResolver {
  constructor(
    private readonly ai: AiService,
    private readonly aiCron: AiCronService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => AIErrorSummary, { nullable: true })
  async summarizeErrorGroup(
    @Args('errorGroupId') errorGroupId: string,
  ): Promise<AIErrorSummary | null> {
    try {
      const group = await this.prisma.errorGroup.findUnique({
        where: { id: errorGroupId },
        include: {
          environment: true,
          service: true,
          project: true,
        },
      });
      if (!group) return null;

      const events = await this.prisma.errorEvent.findMany({
        where: { errorGroupId },
        orderBy: { occurredAt: 'desc' },
        take: 5,
      });

      const sampleStack = events.find((e) => e.stack)?.stack ?? '';
      const latestRelease = events.find((e) => e.release)?.release ?? null;

      let deployContext = '';
      if (latestRelease && group.projectId) {
        const nearbyDeploy = await this.prisma.deployment.findFirst({
          where: {
            environmentId: group.environmentId,
            serviceId: group.serviceId ?? undefined,
          },
          orderBy: { deployedAt: 'desc' },
          take: 1,
        });
        if (nearbyDeploy) {
          deployContext = `\nRelated deployment: ${nearbyDeploy.version} on ${nearbyDeploy.environmentId}`;
        }
      }

      const prompt = [
        'Analyze this error from Sonar error tracking and provide a summary and fix suggestion.',
        `Error: ${group.title}`,
        `Occurrences: ${group.occurrenceCount}`,
        `First seen: ${group.firstSeenAt.toISOString()}`,
        `Last seen: ${group.lastSeenAt.toISOString()}`,
        `Environment: ${group.environment.name}`,
        `Service: ${group.service?.name ?? 'unknown'}`,
        `Latest release: ${latestRelease ?? 'unknown'}`,
        `Sample stack trace:\n${sampleStack.slice(0, 1500)}`,
        deployContext,
        '',
        'Respond with valid JSON only (no markdown):',
        '{ "summary": "2-3 sentence plain-English explanation of what this error means and why it happens", "suggestedFix": "specific actionable fix a developer should implement", "confidence": 0.0-1.0 }',
      ].join('\n');

      const result = await this.ai.generateJson<{
        summary: string;
        suggestedFix?: string;
        confidence?: number;
      }>(prompt, { cacheKey: `error-summary-${errorGroupId}` });

      if (!result?.summary) return null;

      return {
        errorGroupId,
        summary: result.summary,
        suggestedFix: result.suggestedFix ?? null,
        confidence: result.confidence ?? null,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('[AiResolver] summarizeErrorGroup error:', error);
      return null;
    }
  }

  @Query(() => IncidentCorrelation, { nullable: true })
  async incidentCorrelation(
    @Args('incidentId') incidentId: string,
  ): Promise<IncidentCorrelation | null> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { monitor: true, environment: true, service: true },
      });
      if (!incident) return null;

      const startedAt = incident.startedAt.getTime();
      const windowStart = new Date(startedAt - 2 * 60 * 60 * 1000);

      const deployments = await this.prisma.deployment.findMany({
        where: {
          environmentId: incident.environmentId ?? undefined,
          serviceId: incident.serviceId ?? undefined,
          deployedAt: { gte: windowStart, lte: incident.startedAt },
        },
        orderBy: { deployedAt: 'desc' },
        take: 5,
      });

      const deployRefs: DeploymentRef[] = deployments.map((d) => ({
        id: d.id,
        version: d.version,
        environmentName: d.environmentId,
        serviceName: d.serviceId ?? null,
        deployedAt: d.deployedAt,
        deployedBy: d.deployedBy ?? 'unknown',
      }));

      const errorSpikes = await this.prisma.errorGroup.findMany({
        where: {
          environmentId: incident.environmentId ?? undefined,
          serviceId: incident.serviceId ?? undefined,
          lastSeenAt: { gte: windowStart, lte: incident.startedAt },
        },
        orderBy: { occurrenceCount: 'desc' },
        take: 3,
      });

      const prompt = [
        'Analyze this incident and identify likely causes based on surrounding data.',
        `Incident: ${incident.title}`,
        `Summary: ${incident.summary ?? 'none'}`,
        `Started: ${incident.startedAt.toISOString()}`,
        `Monitor: ${incident.monitor?.name ?? 'unknown'}`,
        `Environment: ${incident.environment?.name ?? 'unknown'}`,
        '',
        'Deployments before incident:',
        ...deployments.map(
          (d) => `  - ${d.version} by ${d.deployedBy ?? 'unknown'} at ${d.deployedAt.toISOString()}`,
        ),
        '',
        'Error spikes:',
        ...errorSpikes.map(
          (e) => `  - ${e.title} (${e.occurrenceCount} occurrences, last: ${e.lastSeenAt.toISOString()})`,
        ),
        '',
        'Respond with valid JSON only (no markdown):',
        '{ "narrative": "3-4 sentence analysis connecting deployments, errors, and monitor state to explain what likely caused this incident" }',
      ].join('\n');

      const result = await this.ai.generateJson<{ narrative: string }>(prompt, {
        cacheKey: `incident-corr-${incidentId}`,
      });

      return {
        incidentId,
        narrative: result?.narrative ?? 'Analysis unavailable.',
        relatedDeployments: deployRefs,
        relatedErrorGroups: errorSpikes.length > 0 ? errorSpikes.map((e) => e.id) : null,
      };
    } catch (error) {
      console.error('[AiResolver] incidentCorrelation error:', error);
      return null;
    }
  }

  @Query(() => HealthTrend, { nullable: true })
  async monitorHealthTrend(
    @Args('monitorId') monitorId: string,
  ): Promise<HealthTrend | null> {
    try {
      const now = Date.now();
      const fortyEightHours = 48 * 60 * 60 * 1000;

      const results = await this.prisma.checkResult.findMany({
        where: {
          monitorId,
          checkedAt: { gte: new Date(now - fortyEightHours) },
        },
        orderBy: { checkedAt: 'asc' },
        select: { latencyMs: true, state: true, checkedAt: true },
      });

      if (results.length < 5) {
        return {
          monitorId,
          trend: HealthTrendDirection.STABLE,
          slope: 0,
          avgLatencyMs: null,
          failureRate: null,
          projectedHoursToCritical: null,
          confidence: null,
          dataPoints: results.length,
          analyzedAt: new Date(),
        };
      }

      const latencies = results
        .map((r) => r.latencyMs)
        .filter((l): l is number => l !== null);
      const failures = results.filter((r) => r.state === 'DOWN' || r.state === 'DEGRADED');
      const failureRate = failures.length / results.length;

      const avgLatencyMs =
        latencies.length > 0
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length
          : null;

      let slope = 0;
      if (latencies.length >= 3) {
        const n = latencies.length;
        const indices = Array.from({ length: n }, (_, i) => i);
        const meanX = (n - 1) / 2;
        const meanY = latencies.reduce((a, b) => a + b, 0) / n;
        let num = 0;
        let den = 0;
        for (let i = 0; i < n; i++) {
          num += (i - meanX) * (latencies[i] - meanY);
          den += (i - meanX) * (i - meanX);
        }
        slope = den !== 0 ? num / den : 0;
      }

      let trend = HealthTrendDirection.STABLE;
      if (failureRate > 0.3) {
        trend = HealthTrendDirection.DECLINING;
      } else if (slope > 0.5) {
        trend = HealthTrendDirection.DECLINING;
      } else if (slope < -0.3) {
        trend = HealthTrendDirection.IMPROVING;
      }

      const confidence = results.length >= 48 ? 0.85 : results.length >= 24 ? 0.7 : 0.5;

      let projectedHoursToCritical: number | null = null;
      if (trend === HealthTrendDirection.DECLINING && avgLatencyMs && slope > 0) {
        const criticalLatency = 5000;
        const hoursToCritical = ((criticalLatency - avgLatencyMs) / slope) *
          (1 / 60);
        if (hoursToCritical > 0 && hoursToCritical < 720) {
          projectedHoursToCritical = hoursToCritical;
        }
      }

      return {
        monitorId,
        trend,
        slope,
        avgLatencyMs: avgLatencyMs !== null ? Math.round(avgLatencyMs * 100) / 100 : null,
        failureRate: Math.round(failureRate * 1000) / 1000,
        projectedHoursToCritical: projectedHoursToCritical !== null
          ? Math.round(projectedHoursToCritical * 10) / 10
          : null,
        confidence,
        dataPoints: results.length,
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.error('[AiResolver] monitorHealthTrend error:', error);
      return null;
    }
  }

  @Query(() => AISessionInsight, { nullable: true })
  async analyzeSession(
    @Args('sessionId') sessionId: string,
  ): Promise<AISessionInsight | null> {
    try {
      const session = await this.prisma.analyticsSession.findUnique({
        where: { id: sessionId },
      });
      if (!session) return null;

      const events = await this.prisma.analyticsEvent.findMany({
        where: { projectId: session.projectId }, // approximate by project
        orderBy: { timestamp: 'asc' },
        take: 100,
      });

      const pageViews = events.filter((e) => e.type === 'page_view');
      const errors = events.filter((e) => e.type === 'error' || e.type === 'error_console');
      const clicks = events.filter((e) => e.type === 'click');
      const urls = [...new Set(pageViews.map((e) => e.url).filter(Boolean))];

      const prompt = [
        'Analyze this user session from Sonar analytics and provide behavioral insights.',
        `Session duration: ${session.duration ?? 'unknown'}s`,
        `Page views: ${pageViews.length}`,
        `Clicks: ${clicks.length}`,
        `Errors: ${errors.length}`,
        `Frustration score: ${session.frustrationScore ?? 'N/A'}`,
        `Interestingness: ${session.interestingnessScore ?? 'N/A'}`,
        `Bounced: ${session.isBounce ? 'yes' : 'no'}`,
        `Pages: ${urls.join(', ') || 'none'}`,
        `Visitor ID: ${session.visitorId ?? 'unknown'}`,
        '',
        'Respond with valid JSON only (no markdown):',
        '{ "summary": "what the user was trying to do and key issues", "keyMoments": ["moment 1", "moment 2"], "frustrationHotspots": ["area 1"], "recommendation": "what to improve" }',
      ].join('\n');

      const result = await this.ai.generateJson<{
        summary: string;
        keyMoments: string[];
        frustrationHotspots: string[];
        recommendation?: string;
      }>(prompt, { cacheKey: `session-${sessionId}`, maxTokens: 512 });

      return {
        sessionId,
        summary: result?.summary ?? 'Analysis unavailable.',
        keyMoments: result?.keyMoments ?? [],
        frustrationHotspots: result?.frustrationHotspots ?? [],
        recommendation: result?.recommendation ?? null,
      };
    } catch (error) {
      console.error('[AiResolver] analyzeSession error:', error);
      return null;
    }
  }

  @Query(() => [AIAnalyticsInsight], { nullable: true })
  async analyticsInsights(
    @Args('workspaceId') workspaceId: string,
    @Args('timeRange', { type: () => String, nullable: true }) timeRange?: string,
  ): Promise<AIAnalyticsInsight[] | null> {
    try {
      const hours = timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const [projects, sessions, events] = await Promise.all([
        this.prisma.project.findMany({ where: { workspaceId } }),
        this.prisma.analyticsSession.findMany({
          where: { project: { workspaceId }, startedAt: { gte: since } },
        }),
        this.prisma.analyticsEvent.findMany({
          where: { project: { workspaceId }, timestamp: { gte: since } },
          take: 500,
        }),
      ]);

      const pageViews = events.filter((e) => e.type === 'page_view');
      const errors = events.filter((e) => e.type === 'error' || e.type === 'error_console');
      const frustrated = sessions.filter((s) => (s.frustrationScore ?? 0) > 50);

      const prompt = [
        'Analyze this analytics data and identify patterns, anomalies, and actionable insights.',
        `Period: last ${hours}h`,
        `Projects: ${projects.length}`,
        `Sessions: ${sessions.length}`,
        `Page views: ${pageViews.length}`,
        `Errors: ${errors.length}`,
        `Frustrated sessions (>50): ${frustrated.length}`,
        `Avg frustration score: ${sessions.length > 0 ? sessions.reduce((a, s) => a + (s.frustrationScore ?? 0), 0) / sessions.length : 0}`,
        `Bounce rate: ${sessions.length > 0 ? (sessions.filter((s) => s.isBounce).length / sessions.length * 100).toFixed(1) : 0}%`,
        '',
        'Respond with valid JSON array only (no markdown):',
        '[{ "title": "short title", "description": "detailed insight", "severity": "INFO|WARNING|CRITICAL", "metric": "metric name or null", "value": number or null }]',
        'Return 2-5 insights. Severity should be INFO, WARNING, or CRITICAL.',
      ].join('\n');

      const result = await this.ai.generateJson<
        Array<{ title: string; description: string; severity: string; metric?: string | null; value?: number | null }>
      >(prompt, { cacheKey: `analytics-insights-${workspaceId}-${timeRange ?? '24h'}`, maxTokens: 1024 });

      if (!result || !Array.isArray(result)) return [];

      const severityMap: Record<string, InsightSeverity> = {
        INFO: InsightSeverity.INFO,
        WARNING: InsightSeverity.WARNING,
        CRITICAL: InsightSeverity.CRITICAL,
      };

      return result.slice(0, 10).map((item) => ({
        title: item.title ?? 'Insight',
        description: item.description ?? '',
        severity: severityMap[item.severity?.toUpperCase()] ?? InsightSeverity.INFO,
        metric: item.metric ?? null,
        value: item.value ?? null,
      }));
    } catch (error) {
      console.error('[AiResolver] analyticsInsights error:', error);
      return null;
    }
  }

  @Mutation(() => IncidentRootCause, { nullable: true })
  async generateIncidentRootCause(
    @Args('incidentId') incidentId: string,
  ): Promise<IncidentRootCause | null> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { monitor: true, environment: true, service: true, project: true },
      });
      if (!incident) return null;

      const startedAt = incident.startedAt.getTime();
      const windowStart = new Date(startedAt - 4 * 60 * 60 * 1000);

      const [deployments, errorGroups, checkResults] = await Promise.all([
        this.prisma.deployment.findMany({
          where: {
            environmentId: incident.environmentId ?? undefined,
            deployedAt: { gte: windowStart, lte: incident.startedAt },
          },
          orderBy: { deployedAt: 'desc' },
          take: 5,
        }),
        this.prisma.errorGroup.findMany({
          where: {
            environmentId: incident.environmentId ?? undefined,
            lastSeenAt: { gte: windowStart, lte: incident.startedAt },
          },
          orderBy: { occurrenceCount: 'desc' },
          take: 5,
        }),
        incident.monitor
          ? this.prisma.checkResult.findMany({
              where: {
                monitorId: incident.monitor.id,
                checkedAt: { gte: windowStart, lte: incident.startedAt },
              },
              orderBy: { checkedAt: 'desc' },
              take: 20,
            })
          : Promise.resolve([]),
      ]);

      const prompt = [
        'A new incident was created. Perform a root cause analysis.',
        `Incident: ${incident.title}`,
        `Severity: ${incident.severity}`,
        `Summary: ${incident.summary ?? 'none'}`,
        `Started: ${incident.startedAt.toISOString()}`,
        `Monitor: ${incident.monitor?.name ?? 'N/A'}`,
        `Environment: ${incident.environment?.name ?? 'N/A'}`,
        '',
        'Deployments before incident:',
        ...deployments.map((d) => `  - ${d.version} at ${d.deployedAt.toISOString()}`),
        '',
        'Recent error groups:',
        ...errorGroups.map(
          (e) => `  - ${e.title} (${e.occurrenceCount} occ, last: ${e.lastSeenAt.toISOString()})`,
        ),
        '',
        'Check results before incident:',
        ...checkResults.map(
          (r) => `  - state: ${r.state}, latency: ${r.latencyMs ?? 'N/A'}ms at ${r.checkedAt.toISOString()}`,
        ),
        '',
        'Respond with valid JSON only (no markdown):',
        '{ "narrative": "detailed root cause analysis", "possibleCauses": ["cause 1", "cause 2"], "suggestions": ["suggestion 1"], "relatedDeploymentId": "deployment id or null" }',
      ].join('\n');

      const result = await this.ai.generateJson<{
        narrative: string;
        possibleCauses: string[];
        suggestions: string[];
        relatedDeploymentId?: string | null;
      }>(prompt, { cacheKey: `root-cause-${incidentId}` });

      return {
        incidentId,
        narrative: result?.narrative ?? 'Root cause analysis unavailable.',
        possibleCauses: result?.possibleCauses ?? [],
        suggestions: result?.suggestions ?? [],
        relatedDeploymentId: result?.relatedDeploymentId ?? null,
      };
    } catch (error) {
      console.error('[AiResolver] generateIncidentRootCause error:', error);
      return null;
    }
  }

  @Query(() => AnalyticsReport, { nullable: true })
  async generateAnalyticsAnalysis(
    @Args('workspaceId') workspaceId: string,
    @Args('timeRange', { type: () => String, nullable: true }) timeRange?: string,
  ): Promise<AnalyticsReport | null> {
    try {
      const hours = timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const periodLabel = timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : 'last 24 hours';

      const [projects, sessions, events] = await Promise.all([
        this.prisma.project.findMany({ where: { workspaceId }, select: { id: true, name: true, slug: true } }),
        this.prisma.analyticsSession.findMany({ where: { project: { workspaceId }, startedAt: { gte: since } } }),
        this.prisma.analyticsEvent.findMany({
          where: { project: { workspaceId }, timestamp: { gte: since } },
          take: 1000,
        }),
      ]);

      const pageViews = events.filter((e) => e.type === 'page_view');
      const errors = events.filter((e) => e.type === 'error' || e.type === 'error_console');
      const clicks = events.filter((e) => e.type === 'click');
      const frustrated = sessions.filter((s) => (s.frustrationScore ?? 0) > 50);
      const bounced = sessions.filter((s) => s.isBounce);

      const topUrls = [...new Map(
        pageViews
          .filter((e) => e.url)
          .map((e) => [e.url, (pageViews.filter((p) => p.url === e.url).length)] as const)
      ).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([url, count]) => `  - ${url} (${count} views)`);

      const avgDuration = sessions.length > 0
        ? sessions.reduce((s, session) => s + (session.duration ?? 0), 0) / sessions.length
        : 0;

      const prompt = [
        'You are a professional analytics analyst. Generate a comprehensive, professional analysis of this project data.',
        `Analysis period: ${periodLabel}`,
        '',
        '=== DATA OVERVIEW ===',
        `Projects: ${projects.map((p) => p.name).join(', ') || 'N/A'}`,
        `Total sessions: ${sessions.length}`,
        `Total events: ${events.length}`,
        `Page views: ${pageViews.length}`,
        `Clicks: ${clicks.length}`,
        `Errors: ${errors.length}`,
        `Avg session duration: ${Math.round(avgDuration)}s`,
        `Bounce rate: ${sessions.length > 0 ? Math.round((bounced.length / sessions.length) * 100) : 0}%`,
        `Frustrated sessions (>50 score): ${frustrated.length}`,
        `Total rage clicks: ${sessions.reduce((s, session) => s + (session.totalRageClicks ?? 0), 0)}`,
        `Total dead clicks: ${sessions.reduce((s, session) => s + (session.totalDeadClicks ?? 0), 0)}`,
        '',
        'Top pages:',
        ...topUrls,
        '',
        'Respond with valid JSON only (no markdown). Use professional, business-appropriate language:',
        `{
          "executiveSummary": "2-3 paragraph executive summary of overall health and key findings",
          "trafficInsights": ["3-5 specific insights about traffic patterns, popular pages, and engagement"],
          "behaviorInsights": ["3-5 insights about user behavior, session patterns, and flow"],
          "frustrationHotspots": ["2-4 specific areas where users struggle, with metrics"],
          "recommendations": ["3-5 actionable recommendations prioritized by impact"]
        }`,
      ].join('\n');

      const result = await this.ai.generateJson<{
        executiveSummary: string;
        trafficInsights: string[];
        behaviorInsights: string[];
        frustrationHotspots: string[];
        recommendations: string[];
      }>(prompt, {
        cacheKey: `analytics-report-${workspaceId}-${timeRange ?? '24h'}`,
        temperature: 0.4,
        maxTokens: 1536,
      });

      if (!result?.executiveSummary) return null;

      return {
        workspaceId,
        executiveSummary: result.executiveSummary,
        trafficInsights: result.trafficInsights ?? [],
        behaviorInsights: result.behaviorInsights ?? [],
        frustrationHotspots: result.frustrationHotspots ?? [],
        recommendations: result.recommendations ?? [],
        periodLabel,
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.error('[AiResolver] generateAnalyticsAnalysis error:', error);
      return null;
    }
  }

  @Mutation(() => String, { nullable: true })
  async generateWeeklyBrief(
    @Args('workspaceId') workspaceId: string,
  ): Promise<string | null> {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: { workspaceId },
        select: { userId: true },
      });
      const userIds = memberships.map((m) => m.userId);
      return await this.aiCron.generateBriefForWorkspace(workspaceId, userIds);
    } catch (error) {
      console.error('[AiResolver] generateWeeklyBrief error:', error);
      return null;
    }
  }

  @Query(() => AlertTriage, { nullable: true })
  async alertTriage(
    @Args('alertRuleId') alertRuleId: string,
  ): Promise<AlertTriage | null> {
    try {
      const rule = await this.prisma.alertRule.findUnique({
        where: { id: alertRuleId },
        include: { alertChannel: true, project: true },
      });
      if (!rule) return null;

      const recentAlerts = await this.prisma.alertRule.findMany({
        where: { workspaceId: rule.workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const recentIncidents = await this.prisma.incident.findMany({
        where: { workspaceId: rule.workspaceId },
        orderBy: { startedAt: 'desc' },
        take: 5,
      });

      const prompt = [
        'Analyze this alert rule and provide triage context.',
        `Rule: triggerType=${rule.triggerType}, minSeverity=${rule.minimumSeverity}`,
        `Channel: ${rule.alertChannel?.type ?? 'unknown'}`,
        '',
        'Recent alert rules in workspace:',
        ...recentAlerts.map((r) => `  - ${r.triggerType} (${r.minimumSeverity}) ${r.isEnabled ? 'enabled' : 'disabled'}`),
        '',
        'Recent incidents:',
        ...recentIncidents.map((i) => `  - ${i.title} (${i.severity}, ${i.status})`),
        '',
        'Respond with valid JSON only (no markdown):',
        '{ "context": "what this alert typically correlates with", "frequency": "how often it fires", "suggestion": "whether to adjust thresholds or silence" }',
      ].join('\n');

      const result = await this.ai.generateJson<{
        context: string;
        frequency: string;
        suggestion: string;
      }>(prompt, {
        cacheKey: `alert-triage-${alertRuleId}`,
        maxTokens: 256,
      });

      return {
        alertRuleId,
        context: result?.context ?? null,
        frequency: result?.frequency ?? null,
        suggestion: result?.suggestion ?? null,
      };
    } catch (error) {
      console.error('[AiResolver] alertTriage error:', error);
      return null;
    }
  }
}
