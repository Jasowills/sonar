import { useState, useEffect, useMemo } from 'react'
import { BarChart3, Activity, Users, Timer, CornerDownRight, ArrowRight, Eye, Flame, AlertTriangle, AlertCircle, Sparkles, Loader2, FileText } from 'lucide-react'
import {
  useAnalyticsOverview,
  useAnalyticsPageViews,
  useAnalyticsSources,
  useAnalyticsEventTypes,
  useAnalyticsInsights,
  useAnalyticsReport,
} from '@/lib/api'
import type { AIAnalyticsInsight, AnalyticsReport } from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { PageNotice } from '@/components/page-notice'
import { timeAgo } from '@/lib/format'

export function AnalyticsPage() {
  const { project } = useSelectedProject()
  const projectId = project?.id
  const workspaceId = project?.workspaceId
  const { data: overview, isLoading, isError, refetch } = useAnalyticsOverview(projectId)
  const { data: sources } = useAnalyticsSources(projectId)
  const { data: eventTypes } = useAnalyticsEventTypes(projectId)
  const { data: aiInsights, isLoading: aiLoading } = useAnalyticsInsights(workspaceId)
  const [reportTimeRange, setReportTimeRange] = useState('24h')
  const [generatedReport, setGeneratedReport] = useState(false)
  const { data: report, isLoading: reportLoading, refetch: generateReport } = useAnalyticsReport(workspaceId, generatedReport ? reportTimeRange : undefined)
  const [pageViewDays, setPageViewDays] = useState(7)
  const dateRange = useMemo(() => {
    const now = Date.now()
    return {
      from: new Date(now - pageViewDays * 86400000).toISOString(),
      to: new Date(now).toISOString(),
    }
  }, [pageViewDays])
  const { data: timeSeries, isLoading: pvLoading, isError: pvError } = useAnalyticsPageViews(projectId, dateRange.from, dateRange.to)

  useEffect(() => {
    console.log('[analytics] pageViewDays:', pageViewDays, 'from:', dateRange.from, 'to:', dateRange.to)
    console.log('[analytics] timeSeries:', timeSeries, 'loading:', pvLoading, 'error:', pvError)
  }, [timeSeries, pvLoading, pvError, pageViewDays, dateRange])

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
  const hasPageViewData = (timeSeries ?? []).some((p) => p.count > 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-main)]">Overview</h2>
        <a
          href="/app/analytics/sessions"
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          <Eye className="h-3.5 w-3.5" />
          View sessions
          <ArrowRight className="h-3 w-3" />
        </a>
      </div>
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

      {/* Two-column main area */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left column: AI content */}
        <div className="space-y-6">
          {/* AI Analytics Report */}
          <div className="border border-[var(--border-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--text-muted)]" />
                <h2 className="text-sm font-semibold text-[var(--text-main)]">AI Analytics Report</h2>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={reportTimeRange}
                  onChange={(e) => setReportTimeRange(e.target.value)}
                  className="border border-[var(--border-soft)] bg-transparent px-3 py-1.5 text-xs text-[var(--text-main)] outline-none"
                >
                  <option value="24h">24h</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </select>
                <button
                  onClick={() => setGeneratedReport(true)}
                  disabled={reportLoading}
                  className="flex items-center gap-2 border border-[var(--border-soft)] px-3 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-50"
                >
                  {reportLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Generate
                </button>
              </div>
            </div>

            {reportLoading && (
              <div className="flex items-center gap-3 px-5 py-8">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">Generating professional analysis…</p>
              </div>
            )}

            {report && (
              <div className="space-y-5 px-5 py-6">
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-soft)]">
                    {report.periodLabel} · {new Date(report.analyzedAt).toLocaleString()}
                  </p>
                  <p className="text-sm leading-6 text-[var(--text-main)]">
                    {report.executiveSummary}
                  </p>
                </div>

                {report.trafficInsights.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-[var(--text-main)]">Traffic & Engagement</p>
                    <ul className="space-y-2">
                      {report.trafficInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-6 text-[var(--text-muted)]">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-soft)]" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.behaviorInsights.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-[var(--text-main)]">User Behavior</p>
                    <ul className="space-y-2">
                      {report.behaviorInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-6 text-[var(--text-muted)]">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-soft)]" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.frustrationHotspots.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-[var(--text-main)]">Frustration & Issues</p>
                    <ul className="space-y-2">
                      {report.frustrationHotspots.map((hotspot, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-6 text-[var(--dot-down)]">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dot-down)]" />
                          {hotspot}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.recommendations.length > 0 && (
                  <div className="border-l-2 border-[var(--dot-degraded)] bg-[var(--surface-panel-soft)] px-4 py-4">
                    <p className="mb-2 text-xs font-semibold text-[var(--text-main)]">Recommendations</p>
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm leading-6 text-[var(--text-muted)]">
                          {i + 1}. {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!report && !reportLoading && generatedReport && (
              <div className="px-5 py-8">
                <p className="text-sm text-[var(--text-muted)]">
                  Unable to generate report. Check your API key configuration.
                </p>
              </div>
            )}
          </div>

          {/* AI Insights */}
          {aiInsights && aiInsights.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--dot-degraded)]" />
                <h2 className="text-sm font-semibold text-[var(--text-main)]">AI Insights</h2>
              </div>
              <div className="space-y-3">
                {aiInsights.map((insight, i) => (
                  <div
                    key={i}
                    className={`border px-5 py-4 ${
                      insight.severity === 'CRITICAL'
                        ? 'border-red-500/30 bg-red-500/5'
                        : insight.severity === 'WARNING'
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-[var(--border-soft)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                        insight.severity === 'CRITICAL' ? 'bg-red-500' : insight.severity === 'WARNING' ? 'bg-amber-500' : 'bg-[var(--text-muted)]'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-main)]">{insight.title}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{insight.description}</p>
                        {insight.metric && insight.value !== null && (
                          <p className="mt-1 text-xs text-[var(--text-soft)]">
                            {insight.metric}: {insight.value}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Data tables + frustration + chart */}
        <div className="space-y-6">
          {/* Top pages */}
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
                    <span className="ml-3 text-xs font-medium text-[var(--text-muted)]">
                      {page.views}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traffic sources */}
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
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {source.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Frustration */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">User Frustration</h2>
            <div className="space-y-4">
              <StatCard
                icon={Flame}
                label="Rage clicks"
                value={overview.totalRageClicks.toLocaleString()}
                sub="Rapid repeated clicks"
                color="text-amber-500"
              />
              <StatCard
                icon={AlertTriangle}
                label="Dead clicks"
                value={overview.totalDeadClicks.toLocaleString()}
                sub="Clicks with no UI change"
                color="text-amber-600"
              />
              <StatCard
                icon={AlertCircle}
                label="Total errors"
                value={overview.totalErrors.toLocaleString()}
                sub="JS & Network issues"
                color="text-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Page views chart */}
        <div className="border border-[var(--border-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Page views</h3>
            <select
              value={pageViewDays}
              onChange={(e) => setPageViewDays(Number(e.target.value))}
              className="border border-[var(--border-soft)] bg-transparent px-3 py-1.5 text-xs text-[var(--text-main)] outline-none"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          <div className="px-5 py-6">
            {pvLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">Loading chart data…</p>
              </div>
            ) : pvError ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <AlertCircle className="h-5 w-5 text-[var(--dot-down)]" />
                <p className="text-sm text-[var(--dot-down)]">Could not load page views.</p>
              </div>
            ) : timeSeries && timeSeries.length > 0 && hasPageViewData ? (
              <div className="flex items-end gap-1">
                {timeSeries.map((point) => (
                  <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full bg-[var(--accent)]/60 transition-all hover:bg-[var(--accent)]"
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
              <div className="flex flex-col items-center gap-2 py-8">
                <BarChart3 className="h-5 w-5 text-[var(--text-soft)]" />
                <p className="text-sm text-[var(--text-soft)]">No page views in this period.</p>
                <p className="text-xs text-[var(--text-soft)]">Try a wider date range.</p>
              </div>
            )}
          </div>
        </div>

        {/* Events by type */}
        {eventTypes && eventTypes.length > 0 && (
          <div className="border border-[var(--border-soft)]">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--text-main)]">Events by type</h3>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {eventTypes.map((t) => (
                <div key={t.type} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-[var(--text-main)]">{t.type}</span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
  color?: string
}) {
  return (
    <div className="border border-[var(--border-soft)] px-5 py-4">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${color || 'text-[var(--text-muted)]'}`} />
        <span className="text-xs font-semibold text-[var(--text-muted)]">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold tracking-[-0.02em] ${color || 'text-[var(--text-main)]'}`}>{value}</p>
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
