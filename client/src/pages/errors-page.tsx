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
import { sanitizeError } from '@/lib/utils'

const LABEL_CLS = 'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]'

export function ErrorsPage() {
  const { project } = useSelectedProject()
  const { data: groups, isLoading, isError, refetch } = useErrorGroups(project?.slug)
  const { mutateAsync: updateStatus } = useUpdateErrorGroupStatus()
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        <p className="mt-4 text-sm text-[var(--text-muted)]">Loading errors…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-soft)] py-20">
        <Activity className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">Could not reach the API</p>
        <button
          onClick={() => void refetch()}
          className="mt-4 rounded-md border border-[var(--border-soft)] px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-soft)] py-20">
        <Activity className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">No errors yet</p>
        <p className="mt-1 max-w-sm text-center text-xs text-[var(--text-muted)]">
          Errors ingested via the API will show up here as grouped traces.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {groups.map((group) => {
        const isExpanded = expandedGroupId === group.id
        const dotColor =
          group.status === 'OPEN'
            ? 'bg-[var(--dot-down)]'
            : group.status === 'RESOLVED'
              ? 'bg-[var(--dot-healthy)]'
              : 'bg-[var(--dot-degraded)]'
        return (
          <div
            key={group.id}
            className={`overflow-hidden rounded-lg border transition-all ${
              isExpanded
                ? 'border-[var(--border-strong)]'
                : 'border-[var(--border-soft)] hover:border-[var(--border-strong)]'
            } bg-[var(--surface-panel)]`}
          >
            <div
              className="flex cursor-pointer items-center gap-4 px-5 py-4"
              onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor} ${group.status === 'OPEN' ? 'animate-pulse' : ''}`} />
                  <p className="truncate text-sm font-medium text-[var(--text-main)]">
                    {group.title}
                  </p>
                </div>
                <div className="mt-1.5 flex items-center gap-2.5 font-mono text-[10px] text-[var(--text-soft)]">
                  <span>{group.serviceName ?? 'unknown'}</span>
                  <span className="h-3 w-px bg-[var(--border-soft)]" />
                  <span>{group.environmentName}</span>
                  <span className="h-3 w-px bg-[var(--border-soft)]" />
                  <span>{group.occurrenceCount} events</span>
                  <span className="h-3 w-px bg-[var(--border-soft)]" />
                  <span>{timeAgo(group.lastSeenAt)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    void updateStatus({ id: group.id, status: 'RESOLVED' })
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--dot-healthy)]"
                  title="Resolve"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    void updateStatus({ id: group.id, status: 'IGNORED' })
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--dot-degraded)]"
                  title="Ignore"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-[var(--border-soft)]">
                <div className="space-y-4 px-5 py-4">
                  <ErrorSummaryBadge groupId={group.id} />
                  <ErrorGroupEvents groupId={group.id} />
                </div>
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
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-main)]">{summary.summary}</p>
          {summary.suggestedFix && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-soft)]">Fix: </span>
              {summary.suggestedFix}
            </p>
          )}
          {summary.confidence !== null && (
            <p className="mt-1 font-mono text-[10px] text-[var(--text-soft)]">
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
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-xs text-[var(--dot-down)]">{sanitizeError(error)}</p>
    )
  }

  if (!events || events.length === 0) {
    return (
      <p className="text-xs text-[var(--text-muted)]">No events for this error group.</p>
    )
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-page)] px-4 py-3"
        >
          <p className="text-sm font-medium text-[var(--text-main)]">
            {event.message}
          </p>
          {event.stack && (
            <pre className="mt-2 max-h-20 overflow-y-auto rounded-md bg-[var(--surface-panel)] p-2 font-mono text-[10px] text-[var(--text-muted)]">
              {event.stack}
            </pre>
          )}
          <div className="mt-2.5 flex items-center gap-3 font-mono text-[10px] text-[var(--text-soft)]">
            {event.release && <span>Release: {event.release}</span>}
            {event.release && <span className="h-3 w-px bg-[var(--border-soft)]" />}
            <span>{timeAgo(event.occurredAt)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
