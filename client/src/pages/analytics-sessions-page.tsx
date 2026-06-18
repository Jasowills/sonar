import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Timer,
  Activity,
  Flame,
  AlertTriangle,
  AlertCircle,
  MousePointerClick,
  ChevronRight,
  Smartphone,
  Monitor,
  Laptop,
  Clock,
  FileText,
} from 'lucide-react'
import { useAnalyticsSessions, useAnalyticsOverview } from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { PageNotice } from '@/components/page-notice'
import { timeAgo } from '@/lib/format'

export function AnalyticsSessionsPage() {
  const { project } = useSelectedProject()
  const navigate = useNavigate()
  const [limit] = useState(100)
  const projectId = project?.id
  const { data: sessions, isLoading, isError } = useAnalyticsSessions(projectId, limit)
  const { data: overview } = useAnalyticsOverview(projectId)

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading sessions…" />
  }

  if (isError) {
    return <PageNotice variant="error" message="Could not load sessions." />
  }

  const totalSessions = overview?.totalPageViews ?? sessions?.length ?? 0
  const bounceRate = overview?.bounceRate ?? 0
  const avgDuration = overview?.avgSessionDuration

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--text-muted)]" />
            <p className="text-xs font-semibold text-[var(--text-muted)]">Sessions</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">{sessions?.length ?? 0}</p>
          <p className="mt-0.5 text-xs text-[var(--text-soft)]">Last 30 days</p>
        </div>
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--text-muted)]" />
            <p className="text-xs font-semibold text-[var(--text-muted)]">Bounce rate</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">
            {sessions && sessions.length > 0
              ? Math.round((sessions.filter((s) => s.isBounce).length / sessions.length) * 100)
              : 0}%
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-soft)]">Of tracked sessions</p>
        </div>
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-[var(--text-muted)]" />
            <p className="text-xs font-semibold text-[var(--text-muted)]">Avg duration</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">
            {avgDuration ? formatDuration(avgDuration) : '-'}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-soft)]">Per session</p>
        </div>
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-semibold text-[var(--text-muted)]">Frustrated</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">
            {sessions ? sessions.filter((s) => (s.frustrationScore ?? 0) > 50).length : 0}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-soft)]">Score &gt; 50</p>
        </div>
      </div>

      <div className="border border-[var(--border-soft)]">
        <div className="border-b border-[var(--border-soft)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">
            Sessions ({sessions?.length ?? 0})
          </h3>
        </div>

        {sessions && sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-soft)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-5 py-3">Visitor</th>
                  <th className="px-5 py-3">Entry page</th>
                  <th className="px-5 py-3 text-right">Duration</th>
                  <th className="px-5 py-3 text-right">Pages</th>
                  <th className="px-5 py-3">Device</th>
                  <th className="px-5 py-3">Browser</th>
                  <th className="px-5 py-3">Signals</th>
                  <th className="px-5 py-3 text-right">Time</th>
                  <th className="w-10 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => navigate(`/app/analytics/sessions/${session.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[var(--surface-panel-soft)]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel)]">
                          <Users className="h-3 w-3 text-[var(--text-muted)]" />
                        </div>
                        <span className="font-mono text-[11px] font-medium text-[var(--text-main)]">
                          {session.visitorId ? session.visitorId.slice(0, 12) : 'Anonymous'}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-[var(--text-muted)]">
                      {session.startUrl ? (
                        <span className="truncate" title={session.startUrl}>
                          {new URL(session.startUrl).pathname}
                        </span>
                      ) : (
                        <span className="italic text-[var(--text-soft)]">Direct</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-[var(--text-main)]">
                      <div className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[var(--text-soft)]" />
                        {session.duration ? formatDuration(session.duration) : '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-[var(--text-main)]">
                      <div className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3 text-[var(--text-soft)]" />
                        {session.pageViews}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="inline-flex items-center gap-1.5 rounded border border-[var(--border-soft)] px-2 py-1 text-[10px] text-[var(--text-muted)]">
                        {session.device === 'mobile' ? (
                          <Smartphone className="h-3 w-3" />
                        ) : session.device === 'tablet' ? (
                          <Laptop className="h-3 w-3" />
                        ) : (
                          <Monitor className="h-3 w-3" />
                        )}
                        {session.device ?? '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[var(--text-muted)]">{session.browser ?? '-'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {(session.frustrationScore ?? 0) > 50 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">
                            <Flame className="h-3 w-3" />
                            {session.frustrationScore}
                          </span>
                        )}
                        {(session.frustrationScore ?? 0) > 20 && (session.frustrationScore ?? 0) <= 50 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
                            <AlertTriangle className="h-3 w-3" />
                            {session.frustrationScore}
                          </span>
                        )}
                        {session.totalRageClicks > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
                            <MousePointerClick className="h-3 w-3" />
                            {session.totalRageClicks}
                          </span>
                        )}
                        {session.totalErrors > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">
                            <AlertCircle className="h-3 w-3" />
                            {session.totalErrors}
                          </span>
                        )}
                        {!session.hasErrors && (session.frustrationScore ?? 0) <= 20 && session.totalRageClicks === 0 && (
                          <span className="text-[10px] text-[var(--text-soft)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-[var(--text-soft)]">
                      {timeAgo(session.startedAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="h-3.5 w-3.5 text-[var(--text-soft)]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-16">
            <Users className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm font-medium text-[var(--text-main)]">No sessions yet</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Sessions will appear once visitors interact with your site.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '-'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
