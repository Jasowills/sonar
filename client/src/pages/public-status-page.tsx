import { useParams } from 'react-router-dom'
import { useStatusPageBySlug } from '@/lib/api'
import { AlertTriangle, LifeBuoy, CheckCircle, Clock, XCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; dot: string; icon: typeof CheckCircle; a11yLabel: string }> = {
  HEALTHY: { label: 'Operational', dot: 'var(--dot-healthy)', icon: CheckCircle, a11yLabel: 'Healthy' },
  DEGRADED: { label: 'Degraded Performance', dot: 'var(--dot-degraded)', icon: Clock, a11yLabel: 'Degraded' },
  DOWN: { label: 'Major Outage', dot: 'var(--dot-down)', icon: XCircle, a11yLabel: 'Down' },
  PENDING: { label: 'Unknown', dot: 'var(--text-muted)', icon: AlertTriangle, a11yLabel: 'Unknown' },
}

function computeOverall(services: Array<{ status: string }>): { label: string; color: string; icon: typeof CheckCircle } {
  let hasDown = false
  let hasDegraded = false
  for (const s of services) {
    if (s.status === 'DOWN') hasDown = true
    else if (s.status === 'DEGRADED') hasDegraded = true
  }
  if (hasDown) return { label: 'Major Outage', color: STATUS_CONFIG.DOWN.dot, icon: STATUS_CONFIG.DOWN.icon }
  if (hasDegraded) return { label: 'Partial Outage', color: STATUS_CONFIG.DEGRADED.dot, icon: STATUS_CONFIG.DEGRADED.icon }
  return { label: 'All Systems Operational', color: STATUS_CONFIG.HEALTHY.dot, icon: STATUS_CONFIG.HEALTHY.icon }
}

export function PublicStatusPage() {
  const { workspaceSlug, slug } = useParams<{ workspaceSlug: string; slug: string }>()
  const { data: page, isLoading, error } = useStatusPageBySlug(workspaceSlug ?? '', slug ?? '')

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--surface-page)]">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--surface-page)] gap-4">
        <LifeBuoy className="h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">Status page not found</p>
        <p className="text-sm text-[var(--text-muted)]">
          {error ? 'Could not load this status page.' : 'This status page does not exist.'}
        </p>
      </div>
    )
  }

  const overall = computeOverall(page.services)
  const OverallIcon = overall.icon
  const updatedDate = new Date(page.updatedAt).toLocaleString()
  const visibleServices = page.services.filter((s) => s.isVisible)

  const groups = new Map<string, typeof visibleServices>()
  const ungrouped: typeof visibleServices = []
  for (const svc of visibleServices) {
    if (svc.groupName) {
      const existing = groups.get(svc.groupName) ?? []
      existing.push(svc)
      groups.set(svc.groupName, existing)
    } else {
      ungrouped.push(svc)
    }
  }

  return (
    <div
      className="min-h-dvh bg-[var(--surface-page)] text-[var(--text-main)]"
      style={page.brandColor ? { '--status-brand': page.brandColor } as React.CSSProperties : undefined}
    >
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-12 text-center">
          {page.logoUrl && (
            <img
              src={page.logoUrl}
              alt={`${page.name} logo`}
              className="mx-auto mb-5 max-h-10 object-contain"
            />
          )}
          <h1
            className="text-xl font-semibold tracking-tight text-[var(--text-strong)]"
            style={page.brandColor ? { color: 'var(--status-brand)' } : undefined}
          >
            {page.name}
          </h1>
          {page.headline && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{page.headline}</p>
          )}
        </div>

        <div
          className="mb-12 rounded-xl px-6 py-7"
          style={{
            backgroundColor: `color-mix(in srgb, ${overall.color} 8%, transparent)`,
          }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: overall.color }}
              aria-hidden="true"
            />
            <OverallIcon
              className="h-5 w-5"
              style={{ color: overall.color }}
              aria-hidden="true"
            />
            <span className="text-lg font-semibold" style={{ color: overall.color }}>
              {overall.label}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Updated {updatedDate}
          </p>
        </div>

        {visibleServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">No services configured</p>
          </div>
        ) : (
          <div className="mb-14">
            <div className="space-y-6">
              {Array.from(groups.entries()).map(([groupName, services]) => (
                <div key={groupName}>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {groupName}
                  </h2>
                  <div className="overflow-hidden rounded-lg border border-[var(--border-soft)]">
                    {services.map((svc) => {
                      const config = STATUS_CONFIG[svc.status] ?? STATUS_CONFIG.PENDING
                      return (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-3.5 last:border-b-0 transition-colors hover:bg-[var(--surface-panel-soft)]"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-[var(--text-main)]">
                              {svc.displayName ?? svc.name}
                            </p>
                            {svc.latencyMs != null && (
                              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                {svc.latencyMs}ms
                              </p>
                            )}
                          </div>
                          <span className="flex shrink-0 items-center gap-2 text-xs text-[var(--text-muted)]">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: config.dot }}
                              aria-hidden="true"
                            />
                            <span className="sr-only">{config.a11yLabel}</span>
                            {config.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {ungrouped.length > 0 && (
                <div>
                  {groups.size > 0 && (
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Other Services
                    </h2>
                  )}
                  <div className="overflow-hidden rounded-lg border border-[var(--border-soft)]">
                    {ungrouped.map((svc) => {
                      const config = STATUS_CONFIG[svc.status] ?? STATUS_CONFIG.PENDING
                      return (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-3.5 last:border-b-0 transition-colors hover:bg-[var(--surface-panel-soft)]"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-[var(--text-main)]">
                              {svc.displayName ?? svc.name}
                            </p>
                            {svc.latencyMs != null && (
                              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                {svc.latencyMs}ms
                              </p>
                            )}
                          </div>
                          <span className="flex shrink-0 items-center gap-2 text-xs text-[var(--text-muted)]">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: config.dot }}
                              aria-hidden="true"
                            />
                            <span className="sr-only">{config.a11yLabel}</span>
                            {config.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {page.footerText && (
          <p className="mb-3 text-center text-xs text-[var(--text-muted)]">
            {page.footerText}
          </p>
        )}
        <p className="text-center text-[11px] text-[var(--text-muted)]">
          Powered by{' '}
          <a
            href="https://sonar.codes"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 decoration-[var(--text-muted)]/30 hover:decoration-[var(--text-muted)] transition-colors"
          >
            Sonar
          </a>
        </p>
      </div>
    </div>
  )
}
