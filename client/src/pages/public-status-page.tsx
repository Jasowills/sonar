import { useParams } from 'react-router-dom'
import { useStatusPageBySlug } from '@/lib/api'
import { AlertTriangle, LifeBuoy } from 'lucide-react'

const PUBLIC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  HEALTHY: { label: 'Operational', color: '#22c55e' },
  DEGRADED: { label: 'Degraded Performance', color: '#d97706' },
  DOWN: { label: 'Major Outage', color: '#dc2626' },
  PENDING: { label: 'Unknown', color: 'var(--text-muted)' },
}

function computeOverall(services: Array<{ status: string }>): { label: string; color: string } {
  let hasDown = false
  let hasDegraded = false
  for (const s of services) {
    if (s.status === 'DOWN') hasDown = true
    else if (s.status === 'DEGRADED') hasDegraded = true
  }
  if (hasDown) return { label: 'Major Outage', color: '#dc2626' }
  if (hasDegraded) return { label: 'Partial Outage', color: '#d97706' }
  return { label: 'All Systems Operational', color: '#22c55e' }
}

export function PublicStatusPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: page, isLoading, error } = useStatusPageBySlug(slug ?? '')

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0a]">
        <p className="text-sm text-[#666]">Loading…</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0a0a] gap-4">
        <LifeBuoy className="h-10 w-10 text-[#666]" />
        <p className="text-lg font-semibold text-[#ccc]">Status page not found</p>
        <p className="text-sm text-[#666]">
          {error ? 'Could not load this status page.' : 'This status page does not exist.'}
        </p>
      </div>
    )
  }

  const overall = computeOverall(page.services)

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-[#ccc]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white">{page.name}</h1>
          {page.headline && (
            <p className="mt-2 text-sm text-[#666]">{page.headline}</p>
          )}
        </div>

        <div
          className="mb-10 border px-6 py-5 text-center"
          style={{ borderColor: overall.color }}
        >
          <div className="flex items-center justify-center gap-3">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: overall.color }}
            />
            <span className="text-lg font-semibold text-white">{overall.label}</span>
          </div>
          <p className="mt-2 text-xs text-[#666]">
            Updated {new Date(page.updatedAt).toLocaleString()}
          </p>
        </div>

        <div className="divide-y divide-[#222] border border-[#222]">
          {page.services.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-12">
              <AlertTriangle className="mb-3 h-8 w-8 text-[#444]" />
              <p className="text-sm text-[#666]">No services configured</p>
            </div>
          ) : (
            page.services.map((svc) => {
              const statusInfo = PUBLIC_STATUS_LABELS[svc.status] ?? PUBLIC_STATUS_LABELS.PENDING
              return (
                <div
                  key={svc.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="text-sm text-white">{svc.displayName ?? svc.name}</p>
                    <p className="text-xs text-[#666]">
                      {svc.latencyMs != null ? `${svc.latencyMs}ms` : '-'}
                    </p>
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
