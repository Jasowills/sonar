import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ExternalLink, Flame, AlertTriangle, Monitor } from 'lucide-react'
import { useAnalyticsSessions } from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { PageNotice } from '@/components/page-notice'

export function AnalyticsSessionsPage() {
  const { project } = useSelectedProject()
  const navigate = useNavigate()
  const [limit] = useState(50)
  const { data: sessions, isLoading, isError, refetch } = useAnalyticsSessions(project?.id, limit)

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading sessions…" />
  }

  if (isError) {
    return (
      <PageNotice
        variant="error"
        message="Could not load session data."
        onRetry={() => void refetch()}
      />
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Users className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">No sessions yet</p>
        <p className="mt-1 max-w-sm text-center text-sm text-[var(--text-muted)]">
          Sessions will appear here once the SonarWeb SDK starts tracking visitors.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto border border-[var(--border-soft)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border-soft)] bg-[var(--surface-panel)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-5 py-3">Visitor</th>
              <th className="px-5 py-3">Device</th>
              <th className="px-5 py-3">Start page</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Views</th>
              <th className="px-5 py-3">Signals</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Started</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-soft)]">
            {sessions.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-[var(--surface-panel-soft)] cursor-pointer"
                onClick={() => navigate(`/app/analytics/sessions/${s.id}`)}
              >
                <td className="px-5 py-3 font-mono text-xs text-[var(--text-main)]">
                  {s.visitorId ? s.visitorId.slice(0, 12) + '…' : '-'}
                </td>
                <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                  {s.browser || '-'}
                  {s.os && <span className="ml-1 text-[var(--text-soft)]">· {s.os}</span>}
                </td>
                <td className="max-w-[160px] truncate px-5 py-3 text-[var(--text-main)]">
                  {s.startUrl}
                </td>
                <td className="px-5 py-3 text-[var(--text-main)]">
                  {s.duration ? formatDuration(s.duration) : '-'}
                </td>
                <td className="px-5 py-3 text-[var(--text-main)]">{s.pageViews}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {s.totalRageClicks > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-500" title={`${s.totalRageClicks} rage clicks`}>
                        <Flame className="h-3 w-3" />
                        {s.totalRageClicks}
                      </span>
                    )}
                    {s.totalDeadClicks > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600" title={`${s.totalDeadClicks} dead clicks`}>
                        <AlertTriangle className="h-3 w-3" />
                        {s.totalDeadClicks}
                      </span>
                    )}
                    {s.hasErrors && (
                      <span className="flex items-center gap-0.5 text-xs text-red-500" title="Has errors">
                        <Users className="h-3 w-3" />
                        {s.totalErrors}
                      </span>
                    )}
                    {!s.hasFrustrationSignals && (
                      <span className="text-xs text-[var(--text-soft)]">—</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  {s.frustrationScore != null ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      s.frustrationScore >= 50 ? 'text-red-500' :
                      s.frustrationScore >= 20 ? 'text-amber-500' :
                      'text-[var(--text-muted)]'
                    }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                        s.frustrationScore >= 50 ? 'bg-red-500' :
                        s.frustrationScore >= 20 ? 'bg-amber-500' :
                        'bg-[var(--text-muted)]'
                      }`} />
                      {s.frustrationScore}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-soft)]">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                  {new Date(s.startedAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
