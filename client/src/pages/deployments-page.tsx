import { useState } from 'react'
import { deploymentStatusMeta } from '@/lib/deployment-status'
import { timeAgo } from '@/lib/format'
import { useDeployments, useRecordDeployment, useEnvironments, useServices } from '@/lib/api'
import { PageNotice } from '@/components/page-notice'
import { Package, Plus, Check } from 'lucide-react'
import { parseGraphqlError } from '@/lib/utils'

export function DeploymentsPage() {
  const { data: deployments, isLoading, isError, refetch } = useDeployments()
  const { mutateAsync: recordDeployment } = useRecordDeployment()
  const { data: environments } = useEnvironments()
  const { data: services } = useServices()
  const [showForm, setShowForm] = useState(false)
  const [version, setVersion] = useState('')
  const [environmentId, setEnvironmentId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [status, setStatus] = useState('SUCCEEDED')
  const [description, setDescription] = useState('')
  const [deployedBy, setDeployedBy] = useState('')
  const [mutationError, setMutationError] = useState<string[] | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await recordDeployment({
        version,
        environmentId,
        serviceId: serviceId || undefined,
        status: status as 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'ROLLED_BACK',
        description: description || undefined,
        deployedBy: deployedBy || undefined,
      })
      setVersion('')
      setEnvironmentId('')
      setServiceId('')
      setStatus('SUCCEEDED')
      setDescription('')
      setDeployedBy('')
      setShowForm(false)
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          {showForm ? null : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Record deployment'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 border border-[var(--border-soft)] p-5">
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Version (e.g. v1.2.3)"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
              className="border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <input
              type="text"
              placeholder="Deployed by (optional)"
              value={deployedBy}
              onChange={(e) => setDeployedBy(e.target.value)}
              className="border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <select
              value={environmentId}
              onChange={(e) => setEnvironmentId(e.target.value)}
              required
              className="border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
            >
              <option value="">Select environment</option>
              {(environments ?? []).map((env) => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
            >
              <option value="">Select service (optional)</option>
              {(services ?? []).map((svc) => (
                <option key={svc.id} value={svc.id}>{svc.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
            >
              <option value="SUCCEEDED">Succeeded</option>
              <option value="FAILED">Failed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ROLLED_BACK">Rolled Back</option>
            </select>
          </div>
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Check className="h-4 w-4" />
              Record
            </button>
            {mutationError && (
              <div className="space-y-0.5">
                {mutationError.map((msg, i) => (
                  <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
                ))}
              </div>
            )}
          </div>
        </form>
      )}

      {deployments.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
          <p className="text-lg font-semibold text-[var(--text-main)]">No deployments yet</p>
          <p className="mt-1 max-w-sm text-center text-sm text-[var(--text-muted)]">
            Record your first deployment using the button above, or POST to /ingest/deployments.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  )
}
