import { Activity, Package, Plus } from 'lucide-react'
import { useState } from 'react'

import {
  useDeployments,
  useErrorGroups,
  useMonitors,
  useOverviewSnapshot,
} from '@/lib/api'
import {
  formatInterval,
  formatLatency,
  monitorStateMeta,
} from '@/lib/monitor-state'
import { deploymentStatusMeta } from '@/lib/deployment-status'
import { timeAgo } from '@/lib/format'
import { PageNotice } from '@/components/page-notice'
import { CreateMonitorModal } from '@/features/create/create-monitor-modal'
import { OnboardingWizard } from '@/features/onboarding/onboarding-wizard'
import { useSelectedProject } from '@/hooks/use-selected-project'

export function DashboardPage() {
  const { project } = useSelectedProject()
  const { data, isLoading, isError, refetch } = useOverviewSnapshot()
  const { data: monitors } = useMonitors(project?.slug)
  const { data: deploys } = useDeployments(5)
  const { data: errorGroups } = useErrorGroups(project?.slug)
  const [showCreateMonitor, setShowCreateMonitor] = useState(false)

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading…" />
  }

  if (isError || !data) {
    return (
      <PageNotice
        variant="error"
        message="Could not reach the API."
        onRetry={() => void refetch()}
      />
    )
  }

  const monitorList = monitors ?? data.monitors

  if (monitorList.length === 0) {
    return <OnboardingWizard />
  }

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.metrics.map((item) => (
          <div
            key={item.label}
            className="border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.04em]">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Monitor list */}
          <div className="border border-[var(--border-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">Monitors</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)]">
                  {monitorList.length} checks
                </span>
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
              {monitorList.map((monitor) => {
                const state = monitorStateMeta(monitor.latestState)
                return (
                  <div
                    key={monitor.id}
                    className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-main)]">
                        {monitor.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {monitor.serviceName} · {monitor.environmentName}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      <span>Every {formatInterval(monitor.intervalSeconds)}</span>
                      <span>{formatLatency(monitor.latestLatencyMs)}</span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2 w-2 ${state.dotClass}`}
                        />
                        {state.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Error groups */}
          <div className="border border-[var(--border-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                Recent errors
              </p>
              <Activity className="h-4 w-4 text-[var(--text-muted)]" />
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {!errorGroups ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">
                  Loading…
                </p>
              ) : errorGroups.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">
                  No errors yet.
                </p>
              ) : (
                errorGroups.slice(0, 5).map((group) => (
                  <div key={group.id} className="px-5 py-4">
                    <p className="text-sm font-medium text-[var(--text-main)]">
                      {group.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {group.serviceName ?? 'Unknown service'} ·{' '}
                      {group.environmentName} · {group.occurrenceCount}{' '}
                      occurrences · {timeAgo(group.lastSeenAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Deployments sidebar */}
        <aside className="space-y-4">
          <section className="border border-[var(--border-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                Recent deploys
              </p>
              <Package className="h-4 w-4 text-[var(--text-muted)]" />
            </div>

            <div className="divide-y divide-[var(--border-soft)]">
              {!deploys ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">
                  Loading…
                </p>
              ) : deploys.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">
                  No deploys yet. POST from CI to{' '}
                  <code className="text-[var(--text-main)]">
                    /ingest/deployments
                  </code>
                  .
                </p>
              ) : (
                deploys.map((deploy) => {
                  const status = deploymentStatusMeta(deploy.status)
                  return (
                    <div key={deploy.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-mono text-sm text-[var(--text-main)]">
                          {deploy.version}
                        </p>
                        <span className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <span
                            className={`inline-block h-2 w-2 ${status.dotClass}`}
                          />
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {deploy.environmentName} ·{' '}
                        {deploy.deployedBy ?? 'Unknown'} ·{' '}
                        {timeAgo(deploy.deployedAt)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </aside>
      </div>

      <CreateMonitorModal
        open={showCreateMonitor}
        onClose={() => setShowCreateMonitor(false)}
      />
    </div>
  )
}
