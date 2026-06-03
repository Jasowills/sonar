import { Package } from 'lucide-react'
import { deploymentStatusMeta } from '@/lib/deployment-status'
import { timeAgo } from '@/lib/format'
import { useDeployments } from '@/lib/api'
import { PageNotice } from '@/components/page-notice'

export function DeploymentsPage() {
  const { data: deployments, isLoading, isError, refetch } = useDeployments()

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading deployments…" />
  }

  if (isError || !deployments) {
    return (
      <PageNotice
        variant="error"
        message="Could not reach the API."
        onRetry={() => void refetch()}
      />
    )
  }

  if (deployments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">No deployments yet</p>
        <p className="mt-1 max-w-sm text-center text-sm text-[var(--text-muted)]">
          POST deployment records to /ingest/deployments to track your releases.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-[var(--border-soft)]">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
        <p className="text-sm font-semibold text-[var(--text-main)]">Deployments</p>
        <span className="text-xs text-[var(--text-muted)]">{deployments.length} total</span>
      </div>

      <div className="divide-y divide-[var(--border-soft)]">
        {deployments.map((deploy) => {
          const status = deploymentStatusMeta(deploy.status)
          return (
            <div key={deploy.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-mono text-sm font-medium text-[var(--text-main)]">
                  {deploy.version}
                </p>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <span className={`inline-block h-2 w-2 ${status.dotClass}`} />
                  {status.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {deploy.environmentName} · {deploy.deployedBy ?? 'Unknown'} · {timeAgo(deploy.deployedAt)}
              </p>
              {deploy.description && (
                <p className="mt-1 text-xs text-[var(--text-soft)]">{deploy.description}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
