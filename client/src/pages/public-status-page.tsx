import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, LifeBuoy, CheckCircle, Clock, XCircle, Info,} from 'lucide-react'

const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/graphql').replace('/graphql', '')

const STATUS_LABELS: Record<string, { label: string; short: string; color: string; bg: string }> = {
  operational: { label: 'Operational', short: 'Op', color: 'var(--dot-healthy)', bg: 'bg-[var(--dot-healthy)]' },
  degraded_performance: { label: 'Degraded Performance', short: 'Deg', color: 'var(--dot-degraded)', bg: 'bg-[var(--dot-degraded)]' },
  major_outage: { label: 'Major Outage', short: 'Out', color: 'var(--dot-down)', bg: 'bg-[var(--dot-down)]' },
  unknown: { label: 'Unknown', short: 'N/A', color: 'var(--text-muted)', bg: 'bg-[var(--text-muted)]' },
}

const DAY_COLORS: Record<string, string> = {
  HEALTHY: 'bg-[var(--dot-healthy)]',
  DEGRADED: 'bg-[var(--dot-degraded)]',
  DOWN: 'bg-[var(--dot-down)]',
  PENDING: 'bg-[var(--border-soft)]',
}

const STATUS_DISPLAY = [
  { label: 'Operational', color: 'var(--dot-healthy)' },
  { label: 'Degraded Performance', color: 'var(--dot-degraded)' },
  { label: 'Partial Outage', color: 'var(--dot-down)' },
  { label: 'Major Outage', color: 'var(--dot-down)' },
  { label: 'Maintenance', color: 'var(--text-muted)' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTimeUTC(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', '
    + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    + ' UTC'
}

function UptimeTooltip({ day, status }: { day: string; status: string }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border-soft)] bg-[var(--surface-panel)] px-2 py-1 text-[10px] text-[var(--text-main)] shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
      {formatDate(day)} — {STATUS_LABELS[status]?.label ?? status}
    </div>
  )
}

function UptimeBar({ uptime }: { uptime: Array<{ date: string; status: string }> }) {
  return (
    <div className="flex items-center gap-0.5">
      {uptime.map((day) => (
        <div
          key={day.date}
          className="group relative h-2.5 w-2.5"
        >
          <div
            className={`h-full w-full rounded-sm ${DAY_COLORS[day.status] ?? DAY_COLORS.PENDING} opacity-80 hover:opacity-100 transition-opacity`}
          />
          <UptimeTooltip day={day.date} status={day.status} />
        </div>
      ))}
    </div>
  )
}

type PublicData = {
  page: {
    name: string
    slug: string
    headline: string | null
    logoUrl: string | null
    brandColor: string | null
    footerText: string | null
    theme: string
    darkLogoUrl: string | null
    logoLinkUrl: string | null
  }
  overall: string
  updatedAt: string
  services: Array<{
    id: string
    name: string
    groupName: string | null
    isVisible: boolean
    status: string
    latencyMs: number | null
    uptime: Array<{ date: string; status: string }>
    uptimePercent: number
  }>
  incidents: Array<{
    id: string
    title: string
    status: string
    severity: string
    startedAt: string
    resolvedAt: string | null
    updates: Array<{ kind: string; body: string; createdAt: string }>
  }>
}

function Skeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6">
        <div className="py-8 text-center">
          <div className="mx-auto mb-2 h-4 w-24 animate-pulse rounded bg-[var(--surface-panel-soft)]" />
          <div className="mx-auto h-3 w-40 animate-pulse rounded bg-[var(--surface-panel-soft)]" />
        </div>
        <div className="mb-8 rounded-xl border border-[var(--border-soft)] p-8 text-center">
          <div className="mx-auto mb-3 h-6 w-3 h-3 animate-pulse rounded-full bg-[var(--surface-panel-soft)]" />
          <div className="mx-auto h-6 w-64 animate-pulse rounded bg-[var(--surface-panel-soft)]" />
          <div className="mx-auto mt-2 h-3 w-36 animate-pulse rounded bg-[var(--surface-panel-soft)]" />
        </div>
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-[var(--border-soft)] py-3">
              <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface-panel-soft)]" />
              <div className="flex flex-1 gap-0.5">
                {Array.from({ length: 30 }).map((_, j) => (
                  <div key={j} className="h-3 w-3 animate-pulse rounded-sm bg-[var(--surface-panel-soft)]" />
                ))}
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-[var(--surface-panel-soft)]" />
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-6 text-center">
        <div className="mx-auto h-3 w-28 animate-pulse rounded bg-[var(--surface-panel-soft)]" />
      </div>
    </div>
  )
}

export function PublicStatusPage() {
  const { workspaceSlug, slug } = useParams<{ workspaceSlug: string; slug: string }>()
  const prevDarkRef = useRef(false)
  
  const { data, isLoading, error } = useQuery<PublicData>({
    queryKey: ['publicStatusPage', workspaceSlug, slug],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/status/${workspaceSlug}/${slug}`)
      if (!res.ok) throw new Error('Status page not found')
      return res.json()
    },
    enabled: !!workspaceSlug && !!slug,
    refetchInterval: 60_000,
  })

  const statusInfo = data ? STATUS_LABELS[data.overall] ?? STATUS_LABELS.unknown : null

  useEffect(() => {
    if (!data) return
    prevDarkRef.current = document.documentElement.classList.contains('dark')
    const theme = data.page.theme
    if (theme === 'LIGHT') {
      document.documentElement.classList.remove('dark')
    } else if (theme === 'DARK') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'AUTO') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      if (mq.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    return () => {
      if (prevDarkRef.current) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [data?.page.theme])

  if (isLoading) return <Skeleton />

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6">
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-10 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-panel-soft)]">
              <LifeBuoy className="h-6 w-6 text-[var(--text-muted)]" />
            </div>
            <p className="mb-2 text-lg font-semibold text-[var(--text-strong)]">Status page not found</p>
            <p className="text-sm text-[var(--text-muted)]">
              {error ? 'Could not load this status page.' : 'This status page does not exist.'}
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-6 py-6">
          <p className="text-center text-xs text-[var(--text-muted)]">Powered by Sonar</p>
        </div>
      </div>
    )
  }

  const visibleServices = data.services.filter((s) => s.isVisible)
  const hasServices = visibleServices.length > 0
  const updatedDate = new Date(data.updatedAt).toLocaleString()

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

  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  const activeLogo = (data.page.theme === 'DARK' || (data.page.theme === 'AUTO' && prefersDark)) && data.page.darkLogoUrl
    ? data.page.darkLogoUrl
    : data.page.logoUrl

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--surface-page)] text-[var(--text-main)]"
      style={data.page.brandColor ? { '--status-brand': data.page.brandColor } as React.CSSProperties : undefined}
    >
      {data.page.brandColor && (
        <div className="h-1 shrink-0" style={{ backgroundColor: data.page.brandColor }} />
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6">
        <div className="py-8 text-center">
          {activeLogo && (
            data.page.logoLinkUrl ? (
              <a href={data.page.logoLinkUrl} target="_blank" rel="noopener noreferrer" className="mx-auto mb-2 inline-block">
                <img src={activeLogo} alt={`${data.page.name} logo`} className="mx-auto max-h-10 object-contain" />
              </a>
            ) : (
              <img src={activeLogo} alt={`${data.page.name} logo`} className="mx-auto mb-2 max-h-10 object-contain" />
            )
          )}
          <h1 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
            {data.page.name}
          </h1>
          {data.page.headline && (
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{data.page.headline}</p>
          )}
        </div>

        <div
          className="mb-6 rounded-xl border px-8 py-8 text-center"
          style={{
            backgroundColor: `color-mix(in srgb, ${statusInfo?.color ?? 'var(--dot-healthy)'} 8%, transparent)`,
            borderColor: `color-mix(in srgb, ${statusInfo?.color ?? 'var(--dot-healthy)'} 20%, transparent)`,
          }}
          role="status"
          aria-live="polite"
        >
          <div
            className="mx-auto mb-3 h-3 w-3 rounded-full"
            style={{ backgroundColor: statusInfo?.color ?? 'var(--dot-healthy)' }}
            aria-hidden="true"
          />
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: statusInfo?.color ?? 'var(--dot-healthy)' }}
          >
            {data.overall === 'operational' && 'All Systems Operational'}
            {data.overall === 'degraded_performance' && 'Degraded Performance'}
            {data.overall === 'major_outage' && 'Major Outage'}
            {data.overall === 'unknown' && 'Status Unknown'}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Updated {updatedDate}
          </p>
        </div>

        <div className="mb-6">
          {!hasServices ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-soft)] py-12">
              <AlertTriangle className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">No components configured</p>
            </div>
          ) : (
            <>
              {Array.from(groups.entries()).map(([groupName, services]) => (
                <div key={groupName}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {groupName}
                  </h3>
                  <div className="mb-4 divide-y divide-[var(--border-soft)] rounded-lg border border-[var(--border-soft)]">
                    {services.map((svc) => {
                      const s = STATUS_LABELS[svc.status] ?? STATUS_LABELS.unknown
                      return (
                        <div key={svc.id} className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-[var(--text-main)]">{svc.name}</span>
                                <button
                                  type="button"
                                  className="text-[var(--text-soft)] hover:text-[var(--text-muted)] transition-colors"
                                  title="More information"
                                >
                                  <Info className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <span
                              className="shrink-0 text-sm font-semibold"
                              style={{ color: s.color }}
                            >
                              {s.label}
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[var(--text-soft)] w-14 shrink-0">90 days ago</span>
                              <div className="flex-1 overflow-hidden">
                                <UptimeBar uptime={svc.uptime} />
                              </div>
                              <span className="text-[10px] text-[var(--text-soft)] w-8 shrink-0 text-right">Today</span>
                            </div>
                            {svc.uptimePercent > 0 && (
                              <p className="mt-1 text-[11px] text-[var(--text-soft)]">
                                {svc.uptimePercent}% uptime
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {ungrouped.length > 0 && (
                <div className="mb-4">
                  {groups.size > 0 && (
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Other Services
                    </h3>
                  )}
                  <div className="divide-y divide-[var(--border-soft)] rounded-lg border border-[var(--border-soft)]">
                    {ungrouped.map((svc) => {
                      const s = STATUS_LABELS[svc.status] ?? STATUS_LABELS.unknown
                      return (
                        <div key={svc.id} className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-[var(--text-main)]">{svc.name}</span>
                            </div>
                            <span
                              className="shrink-0 text-sm font-semibold"
                              style={{ color: s.color }}
                            >
                              {s.label}
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[var(--text-soft)] w-14 shrink-0">90 days ago</span>
                              <div className="flex-1 overflow-hidden">
                                <UptimeBar uptime={svc.uptime} />
                              </div>
                              <span className="text-[10px] text-[var(--text-soft)] w-8 shrink-0 text-right">Today</span>
                            </div>
                            {svc.uptimePercent > 0 && (
                              <p className="mt-1 text-[11px] text-[var(--text-soft)]">
                                {svc.uptimePercent}% uptime
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            {STATUS_DISPLAY.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                />
                {s.label}
              </div>
            ))}
        </div>
      </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-6 text-center">
        {data.page.footerText && (
          <p className="mb-2 text-xs text-[var(--text-muted)]">{data.page.footerText}</p>
        )}
        <p className="text-xs text-[var(--text-muted)]">
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
