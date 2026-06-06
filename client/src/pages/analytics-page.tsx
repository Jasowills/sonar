import { BarChart3, ExternalLink, Activity, Users, Timer, CornerDownRight } from 'lucide-react'
import {
  useAnalyticsOverview,
  useAnalyticsPageViews,
  useAnalyticsSources,
  useAnalyticsEventTypes,
} from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { PageNotice } from '@/components/page-notice'
import { timeAgo } from '@/lib/format'

export function AnalyticsPage() {
  const { project } = useSelectedProject()
  const projectId = project?.id
  const { data: overview, isLoading, isError, refetch } = useAnalyticsOverview(projectId)
  const { data: timeSeries } = useAnalyticsPageViews(projectId)
  const { data: sources } = useAnalyticsSources(projectId)
  const { data: eventTypes } = useAnalyticsEventTypes(projectId)

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading analytics…" />
  }

  if (isError) {
    return (
      <PageNotice
        variant="error"
        message="Could not load analytics data."
        onRetry={() => void refetch()}
      />
    )
  }

  if (!overview || overview.totalPageViews === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <BarChart3 className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">No data yet</p>
        <p className="mt-1 max-w-sm text-center text-sm text-[var(--text-muted)]">
          Add the SonarWeb SDK to your site to start tracking page views, clicks, and more.
        </p>
      </div>
    )
  }

  const maxViews = Math.max(...(timeSeries ?? []).map((p) => p.count), 1)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Page views"
          value={overview.totalPageViews.toLocaleString()}
          sub="Last 30 days"
        />
        <StatCard
          icon={Users}
          label="Unique visitors"
          value={overview.uniqueVisitors.toLocaleString()}
          sub="Last 30 days"
        />
        <StatCard
          icon={CornerDownRight}
          label="Bounce rate"
          value={`${Math.round(overview.bounceRate * 100)}%`}
          sub="Single-page sessions"
        />
        <StatCard
          icon={Timer}
          label="Avg. session"
          value={overview.avgSessionDuration ? formatDuration(overview.avgSessionDuration) : '-'}
          sub="Duration in seconds"
        />
      </div>

      <div className="border border-[var(--border-soft)]">
        <div className="border-b border-[var(--border-soft)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">Page views (last 7 days)</h3>
        </div>
        <div className="px-5 py-6">
          {timeSeries && timeSeries.length > 0 ? (
            <div className="flex items-end gap-1">
              {timeSeries.map((point) => (
                <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full bg-[var(--accent-main)]/60 transition-all hover:bg-[var(--accent-main)]"
                    style={{ height: Math.max(4, (point.count / maxViews) * 120) + 'px' }}
                    title={`${point.date}: ${point.count} views`}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {point.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No page view data yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {overview.topPages && overview.topPages.length > 0 && (
          <div className="border border-[var(--border-soft)]">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--text-main)]">Top pages</h3>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {overview.topPages.slice(0, 5).map((page) => (
                <div key={page.url} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--text-main)]">{page.url}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {page.uniqueVisitors} unique · {page.views} views
                    </p>
                  </div>
                  <span className="ml-3 text-sm font-medium text-[var(--text-main)]">
                    {page.views}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sources && sources.length > 0 && (
          <div className="border border-[var(--border-soft)]">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--text-main)]">Traffic sources</h3>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {sources.slice(0, 5).map((source) => (
                <div key={source.referrer} className="flex items-center justify-between px-5 py-3">
                  <span className="truncate text-sm text-[var(--text-main)]">
                    {source.referrer === 'direct' ? 'Direct' : new URL(source.referrer).hostname}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-main)]">
                    {source.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {eventTypes && eventTypes.length > 0 && (
        <div className="border border-[var(--border-soft)]">
          <div className="border-b border-[var(--border-soft)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Events by type</h3>
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            {eventTypes.map((t) => (
              <div key={t.type} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-[var(--text-main)]">{t.type}</span>
                <span className="text-sm font-medium text-[var(--text-main)]">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="border border-[var(--border-soft)] px-5 py-4">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-[var(--text-muted)]" />
        <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[var(--text-main)]">{value}</p>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</p>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
