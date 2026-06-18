import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Package,
  Plus,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'

import {
  useDeployments,
  useErrorGroups,
  useIncidents,
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
import { LogoMark } from '@/components/logo'
import { CreateMonitorModal } from '@/features/create/create-monitor-modal'
import { OnboardingWizard } from '@/features/onboarding/onboarding-wizard'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { useAuth } from '@/hooks/use-auth'

const DISMISS_KEY = 'sonar:onboarding-dismissed'

function isOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true'
  } catch {
    return false
  }
}

function dismissOnboarding() {
  try {
    localStorage.setItem(DISMISS_KEY, 'true')
  } catch {
    // noop
  }
}

function resumeOnboarding() {
  try {
    localStorage.removeItem(DISMISS_KEY)
  } catch {
    // noop
  }
}

export function DashboardPage() {
  const { project } = useSelectedProject()
  const { data, isLoading, isError, refetch } = useOverviewSnapshot()
  const { data: monitors } = useMonitors(project?.slug)
  const { data: deploys } = useDeployments(5)
  const { data: errorGroups } = useErrorGroups(project?.slug)
  const { data: incidents } = useIncidents()
  const { state: authState } = useAuth()
  const [showCreateMonitor, setShowCreateMonitor] = useState(false)
  const [dismissed, setDismissed] = useState(isOnboardingDismissed)

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

  const userName =
    authState.status === 'authenticated'
      ? (authState.user.name ?? authState.user.email).split(' ')[0]
      : ''
  const hour = new Date().getHours()
  let greeting = 'Good evening'
  if (hour < 12) greeting = 'Good morning'
  else if (hour < 17) greeting = 'Good afternoon'

  const healthyCount = monitorList.filter((m) => m.latestState === 'HEALTHY').length
  const degradedCount = monitorList.filter((m) => m.latestState === 'DEGRADED').length
  const downCount = monitorList.filter((m) => m.latestState === 'DOWN').length

  const activeIncidents = incidents?.filter((i) => i.status !== 'RESOLVED') ?? []

  function metricMeta(label: string): {
    icon: React.ComponentType<{ className?: string }>
    color: string
  } {
    const lower = label.toLowerCase()
    if (lower.includes('up') || lower.includes('health') || lower.includes('avail'))
      return { icon: CheckCircle, color: 'text-emerald-500' }
    if (lower.includes('down') || lower.includes('error') || lower.includes('fail'))
      return { icon: XCircle, color: 'text-red-500' }
    if (lower.includes('degrad') || lower.includes('warn') || lower.includes('slow'))
      return { icon: AlertTriangle, color: 'text-amber-500' }
    return { icon: Activity, color: 'text-[var(--text-muted)]' }
  }

  if (monitorList.length === 0 && !dismissed) {
    return (
      <OnboardingWizard
        onSkip={() => {
          dismissOnboarding()
          setDismissed(true)
        }}
      />
    )
  }

  if (monitorList.length === 0 && dismissed) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <LogoMark className="h-10 w-10" />
          <p className="text-lg font-semibold text-[var(--text-main)]">
            {greeting}{userName ? `, ${userName}` : ''}
          </p>
          <p className="max-w-sm text-center text-sm text-[var(--text-muted)]">
            Your dashboard is empty. Create a monitor to start tracking uptime, or pick up the setup guide.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateMonitor(true)}
              className="flex items-center gap-1.5 border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:border-[var(--border-strong)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Create monitor
            </button>
            <button
              onClick={() => {
                resumeOnboarding()
                setDismissed(false)
              }}
              className="flex items-center gap-1.5 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
            >
              Setup guide
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <CreateMonitorModal
          open={showCreateMonitor}
          onClose={() => setShowCreateMonitor(false)}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome greeting */}
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-main)]">
          {greeting}{userName ? `, ${userName}` : ''}
        </h2>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
          {data.workspaceName} · {data.projectName}
        </p>
      </div>

      {/* Monitor health summary */}
      {monitorList.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <HealthCount count={healthyCount} label="Healthy" color="var(--dot-healthy)" />
          <HealthCount count={degradedCount} label="Degraded" color="var(--dot-degraded)" />
          <HealthCount count={downCount} label="Down" color="var(--dot-down)" />
        </div>
      )}

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.metrics.map((item) => {
          const meta = metricMeta(item.label)
          return (
            <div
              key={item.label}
              className="border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5"
            >
              <div className="flex items-center gap-2.5">
                <meta.icon className={`h-4 w-4 ${meta.color}`} />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {item.label}
                </p>
              </div>
              <p className={`mt-2 text-2xl font-bold tracking-[-0.04em] ${meta.color}`}>
                {item.value}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {item.detail}
              </p>
            </div>
          )
        })}
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
              <AlertCircle className="h-4 w-4 text-[var(--dot-down)]" />
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
                errorGroups.slice(0, 5).map((group) => {
                  const statusBorder =
                    group.status === 'OPEN'
                      ? 'border-l-[var(--dot-down)]'
                      : group.status === 'RESOLVED'
                        ? 'border-l-[var(--dot-healthy)]'
                        : 'border-l-[var(--text-soft)]'
                  return (
                    <div key={group.id} className={`border-l-2 ${statusBorder} px-5 py-4`}>
                      <p className="text-sm font-medium text-[var(--text-main)]">
                        {group.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {group.serviceName ?? 'Unknown service'} ·{' '}
                        {group.environmentName} · {group.occurrenceCount}{' '}
                        occurrences · {timeAgo(group.lastSeenAt)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
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

          {/* Active incidents */}
          <section className="border border-[var(--border-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                Active incidents
              </p>
              <AlertTriangle className="h-4 w-4 text-[var(--text-muted)]" />
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {activeIncidents.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">
                  No active incidents.
                </p>
              ) : (
                activeIncidents.slice(0, 5).map((incident) => {
                  const isCritical =
                    incident.severity === 'CRITICAL' || incident.severity === 'HIGH'
                  return (
                    <div
                      key={incident.id}
                      className={`border-l-2 px-5 py-4 ${isCritical ? 'border-l-[var(--dot-down)]' : 'border-l-[var(--dot-degraded)]'}`}
                    >
                      <p className="text-sm font-medium text-[var(--text-main)]">
                        {incident.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {incident.severity} · {timeAgo(incident.startedAt)}
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

function HealthCount({
  count,
  label,
  color,
}: {
  count: number
  label: string
  color: string
}) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="font-medium text-[var(--text-main)]">{count}</span>
      <span className="text-[var(--text-muted)]">{label}</span>
    </span>
  )
}
