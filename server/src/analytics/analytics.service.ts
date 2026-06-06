import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AnalyticsEventModel } from './models/analytics-event.model';

type AnalyticsOverview = {
  totalPageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number | null;
  topPages: Array<{ url: string; views: number; uniqueVisitors: number }>;
};

type PageViewTimeSeries = Array<{ date: string; count: number }>;

type TopPage = { url: string; views: number; uniqueVisitors: number };

type Source = { referrer: string; count: number };

type EventTypeDist = { type: string; count: number };

function parseUA(ua: string): { browser: string; os: string; device: string } {
  let browser = 'unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS') || ua.includes('macOS')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  let device = 'desktop';
  if (/Mobi|Android|iPhone|iPad/i.test(ua)) device = 'mobile';
  else if (/Tablet|iPad/i.test(ua)) device = 'tablet';

  return { browser, os, device };
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async scoreSession(id: string) {
    try {
      const session = await this.prisma.analyticsSession.findUnique({
        where: { id },
        select: { sessionKey: true },
      });
      if (!session) return;
      const key = session.sessionKey ?? id;

      const events = await this.prisma.analyticsEvent.findMany({
        where: { sessionId: key },
      });

      const rageClicks = events.filter((e) => e.type === 'frustration_rage_click').length;
      const deadClicks = events.filter((e) => e.type === 'frustration_dead_click').length;
      const hesitations = events.filter((e) => e.type === 'frustration_hesitation').length;
      const scrollChaos = events.filter((e) => e.type === 'frustration_scroll_chaos').length;
      const cascades = events.filter((e) => e.type === 'frustration_cascade').length;
      const errors = events.filter((e) => e.type === 'console_error' || e.type === 'network_issue').length;
      const forms = events.filter((e) => e.type === 'form_submit' || e.type === 'form_analytics').length;

      const frustrationScore = Math.min(
        rageClicks * 25 + deadClicks * 20 + hesitations * 10 + scrollChaos * 15 + cascades * 40,
        100,
      );

      const interestingnessScore = Math.min(
        rageClicks * 15 + deadClicks * 10 + errors * 20 + forms * 5 + cascades * 30,
        100,
      );

      await this.prisma.analyticsSession.update({
        where: { id },
        data: {
          frustrationScore,
          interestingnessScore,
          hasFrustrationSignals: frustrationScore > 0,
          hasErrors: errors > 0,
          hasFormInteraction: forms > 0,
          totalErrors: errors,
          totalRageClicks: rageClicks,
          totalDeadClicks: deadClicks,
        },
      });
    } catch {
      // scoring is best-effort
    }
  }

  async getOverview(projectId: string): Promise<AnalyticsOverview> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const [pageViews, uniqueVisitors, sessions, topPagesRaw] = await Promise.all([
        this.prisma.analyticsEvent.count({
          where: { projectId, type: 'page_view', timestamp: { gte: thirtyDaysAgo } },
        }),
        this.prisma.analyticsEvent.groupBy({
          by: ['visitorId'],
          where: { projectId, timestamp: { gte: thirtyDaysAgo }, visitorId: { not: null } },
        }),
        this.prisma.analyticsSession.findMany({
          where: { projectId, startedAt: { gte: thirtyDaysAgo } },
          select: { isBounce: true, duration: true },
        }),
        this.prisma.analyticsEvent.groupBy({
          by: ['url'],
          where: { projectId, type: 'page_view', timestamp: { gte: thirtyDaysAgo } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ]);

      const totalSessions = sessions.length;
      const bounceCount = sessions.filter((s) => s.isBounce).length;
      const durations = sessions
        .map((s) => s.duration)
        .filter((d): d is number => d !== null);
      const avgDuration =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : null;

      const topPages: TopPage[] = await Promise.all(
        topPagesRaw.map(async (p) => {
          const unique = await this.prisma.analyticsEvent.groupBy({
            by: ['visitorId'],
            where: { projectId, url: p.url, type: 'page_view', timestamp: { gte: thirtyDaysAgo }, visitorId: { not: null } },
          });
          return { url: p.url, views: p._count.id, uniqueVisitors: unique.length };
        }),
      );

      return {
        totalPageViews: pageViews,
        uniqueVisitors: uniqueVisitors.length,
        bounceRate: totalSessions > 0 ? bounceCount / totalSessions : 0,
        avgSessionDuration: avgDuration,
        topPages,
      };
    } catch {
      return { totalPageViews: 0, uniqueVisitors: 0, bounceRate: 0, avgSessionDuration: null, topPages: [] };
    }
  }

  async getPageViewsTimeSeries(projectId: string, from?: string, to?: string): Promise<PageViewTimeSeries> {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : now;

    try {
      const events = await this.prisma.analyticsEvent.findMany({
        where: { projectId, type: 'page_view', timestamp: { gte: fromDate, lte: toDate } },
        select: { timestamp: true },
        orderBy: { timestamp: 'asc' },
      });

      const map = new Map<string, number>();
      for (const e of events) {
        const key = e.timestamp.toISOString().slice(0, 10);
        map.set(key, (map.get(key) ?? 0) + 1);
      }

      const result: PageViewTimeSeries = [];
      const cursor = new Date(fromDate);
      while (cursor <= toDate) {
        const key = cursor.toISOString().slice(0, 10);
        result.push({ date: key, count: map.get(key) ?? 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      return result;
    } catch {
      return [];
    }
  }

  async getSessions(projectId: string, limit = 50) {
    try {
      return await this.prisma.analyticsSession.findMany({
        where: { projectId },
        orderBy: { startedAt: 'desc' },
        take: limit,
      });
    } catch {
      return [];
    }
  }

  async getSession(id: string) {
    try {
      return await this.prisma.analyticsSession.findUnique({ where: { id } });
    } catch {
      return null;
    }
  }

  async getSessionEvents(sessionId: string): Promise<AnalyticsEventModel[]> {
    try {
      // Resolve the SDK session UUID from the session record
      const session = await this.prisma.analyticsSession.findUnique({ where: { id: sessionId } });
      const key = session?.sessionKey ?? sessionId;
      const events = await this.prisma.analyticsEvent.findMany({
        where: { sessionId: key },
        orderBy: { timestamp: 'asc' },
      });
      return events.map((e) => ({ ...e, payload: typeof e.payload === 'string' ? e.payload : e.payload ? JSON.stringify(e.payload) : null }));
    } catch {
      return [];
    }
  }

  async getTopPages(projectId: string, limit = 10): Promise<TopPage[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      const raw = await this.prisma.analyticsEvent.groupBy({
        by: ['url'],
        where: { projectId, type: 'page_view', timestamp: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      });

      return await Promise.all(
        raw.map(async (p) => {
          const unique = await this.prisma.analyticsEvent.groupBy({
            by: ['visitorId'],
            where: {
              projectId, url: p.url, type: 'page_view',
              timestamp: { gte: thirtyDaysAgo }, visitorId: { not: null },
            },
          });
          return { url: p.url, views: p._count.id, uniqueVisitors: unique.length };
        }),
      );
    } catch {
      return [];
    }
  }

  async getSources(projectId: string): Promise<Source[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      const raw = await this.prisma.analyticsEvent.groupBy({
        by: ['referrer'],
        where: { projectId, type: 'page_view', timestamp: { gte: thirtyDaysAgo }, referrer: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      return raw.map((r) => ({
        referrer: r.referrer ?? 'direct',
        count: r._count.id,
      }));
    } catch {
      return [];
    }
  }

  async getEventTypes(projectId: string): Promise<EventTypeDist[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      const raw = await this.prisma.analyticsEvent.groupBy({
        by: ['type'],
        where: { projectId, timestamp: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      return raw.map((r) => ({ type: r.type, count: r._count.id }));
    } catch {
      return [];
    }
  }

  async ingest(
    events: Array<{
      type: string; category?: string; name?: string; url: string;
      referrer?: string; userAgent?: string; viewportWidth?: number;
      viewportHeight?: number; screenWidth?: number; screenHeight?: number;
      payload?: string; sessionId?: string; visitorId?: string;
      consentGranted?: boolean; timestamp: Date;
      severity?: number; fingerprint?: string;
    }>,
    session?: {
      visitorId?: string; sessionId?: string; startUrl: string; referrer?: string;
      userAgent?: string; pageViews?: number; eventCount?: number; isBounce?: boolean;
    } | null,
    projectId?: string,
  ) {
    if (!projectId || events.length === 0) return;

    const now = new Date();

    // Upload screenshot data URLs to Cloudinary
    if (this.cloudinary.isConfigured) {
      await Promise.all(
        events
          .filter((e) => e.type === 'screenshot' && e.payload)
          .map(async (e) => {
            try {
              const parsed = JSON.parse(e.payload!);
              if (typeof parsed.data === 'string' && parsed.data.startsWith('data:')) {
                const url = await this.cloudinary.uploadBase64(parsed.data);
                if (url) {
                  parsed.cloudinaryUrl = url;
                  parsed.data = '[uploaded to cloudinary]';
                  e.payload = JSON.stringify(parsed);
                }
              }
            } catch {
              // skip upload failures
            }
          }),
      );
    }

    try {
      await this.prisma.analyticsEvent.createMany({
        data: events.map((e) => ({
          type: e.type,
          category: e.category ?? null,
          name: e.name ?? null,
          url: e.url,
          referrer: e.referrer ?? null,
          userAgent: e.userAgent ?? null,
          viewportWidth: e.viewportWidth ?? null,
          viewportHeight: e.viewportHeight ?? null,
          screenWidth: e.screenWidth ?? null,
          screenHeight: e.screenHeight ?? null,
          payload: e.payload ?? null,
          projectId,
          sessionId: e.sessionId ?? null,
          visitorId: e.visitorId ?? null,
          consentGranted: e.consentGranted ?? false,
          severity: e.severity ?? null,
          fingerprint: e.fingerprint ?? null,
          timestamp: e.timestamp ?? now,
        })),
      });

      if (session) {
        const existing = await this.prisma.analyticsSession.findFirst({
          where: { projectId, visitorId: session.visitorId ?? null, isBounce: true },
          orderBy: { startedAt: 'desc' },
        });

        if (existing) {
          await this.prisma.analyticsSession.update({
            where: { id: existing.id },
            data: {
              pageViews: (existing.pageViews ?? 1) + (session.pageViews ?? 1) - 1,
              eventCount: (existing.eventCount ?? 0) + (session.eventCount ?? 0),
              isBounce: session.isBounce ?? false,
              lastActivityAt: now,
              duration: Math.round(
                (now.getTime() - existing.startedAt.getTime()) / 1000,
              ),
            },
          });
          this.scoreSession(existing.id);
        } else {
          const ua = session.userAgent ?? null;
          const parsed = ua ? parseUA(ua) : { browser: 'unknown', os: 'unknown', device: 'unknown' };

          const created = await this.prisma.analyticsSession.create({
            data: {
              sessionKey: session.sessionId ?? null,
              visitorId: session.visitorId ?? null,
              projectId,
              startUrl: session.startUrl,
              referrer: session.referrer ?? null,
              userAgent: session.userAgent ?? null,
              browser: parsed.browser,
              os: parsed.os,
              device: parsed.device,
              pageViews: session.pageViews ?? 1,
              eventCount: session.eventCount ?? 0,
              isBounce: session.isBounce ?? true,
              startedAt: now,
              lastActivityAt: now,
              duration: null,
            },
          });
          this.scoreSession(created.id);
        }
      }

      this.events.emit({
        type: 'analytics_ingested',
        data: { projectId, eventCount: events.length },
      });
    } catch {
      // ingest is best-effort
    }
  }
}
