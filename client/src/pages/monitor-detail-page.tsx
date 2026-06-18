import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'
import { useMonitor, useCheckResults, useUpdateMonitor, useMonitorHealthTrend } from '@/lib/api'
import type { HealthTrendDirection } from '@/lib/api'
import { formatInterval, formatLatency, monitorStateMeta } from '@/lib/monitor-state'
import { timeAgo } from '@/lib/format'
import { PageNotice } from '@/components/page-notice'

function HealthTrendIcon({ trend }: { trend: HealthTrendDirection }) {
  switch (trend) {
    case 'IMPROVING':
      return <TrendingUp className="h-5 w-5 text-[var(--dot-healthy)]" />
    case 'DECLINING':
      return <TrendingDown className="h-5 w-5 text-[var(--dot-down)]" />
    case 'STABLE':
      return <Minus className="h-5 w-5 text-[var(--dot-degraded)]" />
    default:
      return <HelpCircle className="h-5 w-5 text-[var(--text-muted)]" />
  }
}

function stateBarColor(state: string): string {
  switch (state) {
    case 'HEALTHY': return 'var(--dot-healthy)'
    case 'DEGRADED': return 'var(--dot-degraded)'
    case 'DOWN': return 'var(--dot-down)'
    default: return 'var(--text-muted)'
  }
}

function UptimeBar({ results }: { results: Array<{ state: string }> }) {
  if (results.length === 0) return null
  const barCount = Math.min(results.length, 120)
  const recent = results.slice(0, barCount).reverse()

  return (
    <div className="flex items-end gap-[2px]">
      {recent.map((r, i) => (
        <div
          key={i}
          className="h-8 w-2 transition-all hover:scale-125"
          style={{ backgroundColor: stateBarColor(r.state) }}
          title={r.state}
        />
      ))}
    </div>
  )
}

export function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: monitor, isLoading, isError } = useMonitor(id ?? '')
  const { data: checkData, isLoading: checksLoading } = useCheckResults(id ?? '')
  const { data: healthTrend } = useMonitorHealthTrend(id ?? '')
  const { mutateAsync: updateMonitor } = useUpdateMonitor()

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading monitor…" />
  }

  if (isError || !monitor) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">Monitor not found</p>
        <button
          onClick={() => navigate('/app/monitors')}
          className="mt-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to monitors
        </button>
      </div>
    )
  }

  const state = monitorStateMeta(monitor.latestState)
  const results = checkData?.items ?? []
  const healthyCount = results.filter((r) => r.state === 'HEALTHY').length
  const uptimePct = results.length > 0 ? Math.round((healthyCount / results.length) * 100) : null

  return (
    <div>
      <button
        onClick={() => navigate('/app/monitors')}
        className="mb-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to monitors
      </button>

      <div className="mb-6 border border-[var(--border-soft)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className={`inline-block h-3 w-3 ${state.dotClass}`} aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--text-main)]">{monitor.name}</h2>
              <span className="border border-[var(--border-soft)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                {state.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {monitor.method} {monitor.targetUrl}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
              <span>{monitor.serviceName} · {monitor.environmentName}</span>
              <span>Every {formatInterval(monitor.intervalSeconds)}</span>
              <span>Timeout {monitor.timeoutSeconds}s</span>
              <span>Expected {monitor.expectedStatus}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={async () => {
                await updateMonitor({ id: monitor.id, isActive: !monitor.isActive })
              }}
              className={`border px-3 py-1.5 text-xs font-medium ${
                monitor.isActive
                  ? 'border-[var(--border-soft)] text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]'
                  : 'border-[var(--dot-healthy)] text-[var(--dot-healthy)] hover:bg-[var(--dot-healthy)]/10'
              }`}
            >
              {monitor.isActive ? 'Pause' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Status
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-block h-3 w-3 ${state.dotClass}`} />
            <span className="text-xl font-bold tracking-[-0.02em] text-[var(--text-main)]">
              {state.label}
            </span>
          </div>
        </div>
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Latency
          </p>
          <p className="mt-2 text-xl font-bold tracking-[-0.02em] text-[var(--text-main)]">
            {formatLatency(monitor.latestLatencyMs)}
          </p>
        </div>
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Uptime
          </p>
          <p className="mt-2 text-xl font-bold tracking-[-0.02em] text-[var(--text-main)]">
            {uptimePct !== null ? `${uptimePct}%` : '-'}
          </p>
        </div>
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Checks
          </p>
          <p className="mt-2 text-xl font-bold tracking-[-0.02em] text-[var(--text-main)]">
            {results.length}
          </p>
        </div>
      </div>

      {healthTrend && (
        <div className="mb-6 border border-[var(--border-soft)] px-5 py-4">
          <div className="flex items-center gap-3">
            <HealthTrendIcon trend={healthTrend.trend} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Health trend
              </p>
              <p className="mt-1 text-sm text-[var(--text-main)]">
                {healthTrend.trend === 'IMPROVING' && 'Latency is improving'}
                {healthTrend.trend === 'DECLINING' && 'Latency is degrading'}
                {healthTrend.trend === 'STABLE' && 'Latency is stable'}
                {healthTrend.avgLatencyMs !== null && ` · avg ${healthTrend.avgLatencyMs}ms`}
                {healthTrend.failureRate !== null && healthTrend.failureRate > 0 && ` · ${(healthTrend.failureRate * 100).toFixed(1)}% failure`}
              </p>
              {healthTrend.projectedHoursToCritical !== null && (
                <p className="mt-0.5 text-xs text-[var(--dot-down)]">
                  Projected critical in ~{healthTrend.projectedHoursToCritical}h
                </p>
              )}
              <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                {healthTrend.dataPoints} data points · {Math.round((healthTrend.confidence ?? 0) * 100)}% confidence
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 border border-[var(--border-soft)]">
        <div className="border-b border-[var(--border-soft)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-main)]">Check history</p>
        </div>
        <div className="px-5 py-6">
          {checksLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading check history…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No check results yet.</p>
          ) : (
            <UptimeBar results={results} />
          )}
        </div>
      </div>

      <div className="border border-[var(--border-soft)]">
        <div className="border-b border-[var(--border-soft)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-main)]">Recent results</p>
        </div>
        {results.length === 0 ? (
          <div className="px-5 py-4">
            <p className="text-sm text-[var(--text-muted)]">No check results yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {results.map((result) => {
              const meta = monitorStateMeta(result.state)
              return (
                <div
                  key={result.id}
                  className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-block h-2 w-2 ${meta.dotClass}`} aria-hidden="true" />
                    <span className="text-sm text-[var(--text-main)]">{meta.label}</span>
                    {result.statusCode && (
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        {result.statusCode}
                      </span>
                    )}
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      {formatLatency(result.latencyMs)}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-soft)]">
                    {timeAgo(result.checkedAt)}
                  </span>
                  {result.errorMessage && (
                    <p className="col-span-full text-xs text-[var(--dot-down)]">
                      {result.errorMessage}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
