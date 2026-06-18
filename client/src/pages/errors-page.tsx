import { useState } from 'react'
import { Activity, CheckCircle2, EyeOff, Sparkles, Loader2 } from 'lucide-react'
import {
  useErrorGroups,
  useErrorEvents,
  useUpdateErrorGroupStatus,
  useErrorSummary,
} from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { timeAgo } from '@/lib/format'
import { PageNotice } from '@/components/page-notice'
import { sanitizeError } from '@/lib/utils'

export function ErrorsPage() {
  const { project } = useSelectedProject()
  const { data: groups, isLoading, isError, refetch } = useErrorGroups(project?.slug)
  const { mutateAsync: updateStatus } = useUpdateErrorGroupStatus()
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading errors…" />
  }

  if (isError) {
    return (
      <PageNotice
        variant="error"
        message="Could not reach the API."
        onRetry={() => void refetch()}
      />
    )
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Activity className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">No errors yet</p>
        <p className="mt-1 max-w-sm text-center text-sm text-[var(--text-muted)]">
          Errors ingested via the API will show up here as grouped traces.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
      {groups.map((group) => {
        const isExpanded = expandedGroupId === group.id
        return (
          <div key={group.id}>
            <div
              className="flex cursor-pointer flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              onClick={() =>
                setExpandedGroupId(isExpanded ? null : group.id)
              }
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block h-2 w-2 shrink-0 ${
                      group.status === 'OPEN'
                        ? 'bg-[var(--dot-down)]'
                        : group.status === 'RESOLVED'
                          ? 'bg-[var(--dot-healthy)]'
                          : 'bg-[var(--dot-degraded)]'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">
                    {group.status === 'OPEN' ? 'Open' : group.status === 'RESOLVED' ? 'Resolved' : group.status}
                  </span>
                  <p className="truncate text-sm font-medium text-[var(--text-main)]">
                    {group.title}
                  </p>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {group.serviceName ?? 'unknown'} · {group.environmentName}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span>{group.occurrenceCount} events</span>
                <span>{timeAgo(group.lastSeenAt)}</span>
                <div className="flex items-center gap-1 border-l border-[var(--border-soft)] pl-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void updateStatus({ id: group.id, status: 'RESOLVED' })
                    }}
                    className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--dot-healthy)]"
                    title="Resolve"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void updateStatus({ id: group.id, status: 'IGNORED' })
                    }}
                    className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--dot-degraded)]"
                    title="Ignore"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
            {isExpanded && (
              <div className="border-t border-[var(--border-soft)]">
                <div className="px-5 py-4">
                  <ErrorSummaryBadge groupId={group.id} />
                </div>
                <ErrorGroupEvents groupId={group.id} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ErrorSummaryBadge({ groupId }: { groupId: string }) {
  const { data: summary, isLoading } = useErrorSummary(groupId)

  if (isLoading) return null

  if (!summary) return null

  return (
    <div className="mb-3 border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-4 py-3">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-main)]">{summary.summary}</p>
          {summary.suggestedFix && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-soft)]">Fix: </span>
              {summary.suggestedFix}
            </p>
          )}
          {summary.confidence !== null && (
            <p className="mt-1 text-[10px] text-[var(--text-soft)]">
              Confidence: {Math.round(summary.confidence * 100)}%
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ErrorGroupEvents({ groupId }: { groupId: string }) {
  const { data: events, isLoading, error } = useErrorEvents(groupId)

  if (isLoading) {
    return (
      <div className="px-5 py-4">
        <p className="text-xs text-[var(--text-muted)]">Loading events…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-5 py-4">
        <p className="text-xs text-[var(--dot-down)]">
          {sanitizeError(error)}
        </p>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="px-5 py-4">
        <p className="text-xs text-[var(--text-muted)]">
          No events for this error group.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-5 py-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="border border-[var(--border-soft)] px-4 py-3"
        >
          <p className="text-sm font-medium text-[var(--text-main)]">
            {event.message}
          </p>
          {event.stack && (
            <pre className="mt-1 max-h-20 overflow-y-auto text-xs text-[var(--text-muted)] font-mono">
              {event.stack}
            </pre>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
            {event.release && <span>Release: {event.release}</span>}
            <span>{timeAgo(event.occurredAt)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
