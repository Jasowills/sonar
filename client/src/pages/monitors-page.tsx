import { Pencil, Plus, Radar, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDeleteMonitor, useMonitors } from '@/lib/api'
import type { Monitor } from '@/lib/api'
import {
  formatInterval,
  formatLatency,
  monitorStateMeta,
} from '@/lib/monitor-state'
import { PageNotice } from '@/components/page-notice'
import { CreateMonitorModal } from '@/features/create/create-monitor-modal'
import { useSelectedProject } from '@/hooks/use-selected-project'

export function MonitorsPage() {
  const { project } = useSelectedProject()
  const { data: monitors, isLoading, isError, refetch } = useMonitors(project?.slug)
  const { mutateAsync: deleteMonitor } = useDeleteMonitor()
  const [showCreateMonitor, setShowCreateMonitor] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading monitors…" />
  }

  if (isError || !monitors) {
    return (
      <PageNotice
        variant="error"
        message="Could not reach the API."
        onRetry={() => void refetch()}
      />
    )
  }

  if (monitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Radar className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">No monitors yet</p>
        <p className="mt-1 max-w-sm text-center text-sm text-[var(--text-muted)]">
          Create an HTTP check to start measuring uptime and latency for your services.
        </p>
            <button
              onClick={() => setShowCreateMonitor(true)}
              className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Plus className="h-3 w-3" />
              Create monitor
            </button>
        <CreateMonitorModal open={showCreateMonitor} onClose={() => setShowCreateMonitor(false)} />
      </div>
    )
  }

  return (
    <>
      <div className="border border-[var(--border-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-main)]">All monitors</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)]">{monitors.length} active</span>
            <button
              onClick={() => setShowCreateMonitor(true)}
              className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Plus className="h-3 w-3" />
              Create
            </button>
          </div>
        </div>

        <div className="divide-y divide-[var(--border-soft)]">
          {monitors.map((monitor) => {
            const state = monitorStateMeta(monitor.latestState)
            return (
              <div
                key={monitor.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    to={`/app/monitors/${monitor.id}`}
                    className="text-sm font-medium text-[var(--text-main)] hover:text-[var(--accent)]"
                  >
                    {monitor.name}
                  </Link>
                  <p className="text-xs text-[var(--text-muted)]">
                    {monitor.serviceName} · {monitor.method} {monitor.targetUrl}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <span>{monitor.environmentName}</span>
                  <span>Every {formatInterval(monitor.intervalSeconds)}</span>
                  <span>{formatLatency(monitor.latestLatencyMs)}</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 ${state.dotClass}`} />
                    {state.label}
                  </span>
                  <div className="flex items-center gap-1 border-l border-[var(--border-soft)] pl-3">
                    <button
                      onClick={() => setEditingMonitor(monitor)}
                      className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
                      title="Edit monitor"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setDeletingId(monitor.id)}
                      className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--dot-down)]"
                      title="Delete monitor"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <CreateMonitorModal
        open={showCreateMonitor}
        onClose={() => setShowCreateMonitor(false)}
      />

      <CreateMonitorModal
        open={!!editingMonitor}
        monitor={editingMonitor ?? undefined}
        onClose={() => setEditingMonitor(null)}
      />

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm border border-[var(--border-soft)] bg-[var(--surface-page)]">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">Delete monitor</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-[var(--text-muted)]">
                Are you sure you want to delete this monitor? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    void deleteMonitor(deletingId)
                    setDeletingId(null)
                  }}
                  className="border border-[var(--dot-down)] px-4 py-2 text-sm text-[var(--dot-down)] hover:bg-[var(--dot-down)]/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
