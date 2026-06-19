import { useState } from 'react'
import { deploymentStatusMeta } from '@/lib/deployment-status'
import { timeAgo } from '@/lib/format'
import { useDeployments, useRecordDeployment, useEnvironments, useServices } from '@/lib/api'
import { Package, Plus, Check, Loader2 } from 'lucide-react'
import { parseGraphqlError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

const LABEL_CLS = 'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]'
const INPUT_CLS = 'w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]'

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
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        <p className="mt-4 text-sm text-[var(--text-muted)]">Loading deployments…</p>
      </div>
    )
  }

  if (isError || !deployments) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-soft)] py-20">
        <Package className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">Could not reach the API</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()} className="mt-4">
          Retry
        </Button>
      </div>
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
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[var(--text-soft)]">
          {deployments.length} total
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? null : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'Record deployment'}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)]">
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Version</label>
                <input
                  type="text"
                  placeholder="e.g. v1.2.3"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  required
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Deployed by</label>
                <input
                  type="text"
                  placeholder="Name or email"
                  value={deployedBy}
                  onChange={(e) => setDeployedBy(e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Environment</label>
                <Select
                  value={environmentId}
                  onChange={(e) => setEnvironmentId(e.target.value)}
                  placeholder="Select environment"
                  options={(environments ?? []).map((env) => ({ value: env.id, label: env.name }))}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Service</label>
                <Select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  placeholder="Select service (optional)"
                  options={(services ?? []).map((svc) => ({ value: svc.id, label: svc.name }))}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Status</label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: 'SUCCEEDED', label: 'Succeeded' },
                    { value: 'FAILED', label: 'Failed' },
                    { value: 'IN_PROGRESS', label: 'In Progress' },
                    { value: 'ROLLED_BACK', label: 'Rolled Back' },
                  ]}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Description</label>
              <textarea
                placeholder="What changed in this release?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border-soft)] px-5 py-3">
            {mutationError && (
              <div className="space-y-0.5">
                {mutationError.map((msg, i) => (
                  <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
                ))}
              </div>
            )}
            <Button type="submit" variant="outline" size="sm" className="ml-auto">
              <Check className="h-3.5 w-3.5" />
              Record
            </Button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {deployments.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-soft)] py-20">
          <Package className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm font-semibold text-[var(--text-main)]">No deployments yet</p>
          <p className="mt-1 max-w-sm text-center text-xs text-[var(--text-muted)]">
            Record your first deployment using the button above, or POST to /ingest/deployments.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="mt-5"
          >
            <Plus className="h-3.5 w-3.5" />
            Record the first deploy
          </Button>
        </div>
      ) : (
        /* Deploy signal cards */
        <div className="space-y-1.5">
          {deployments.map((deploy) => {
            const meta = deploymentStatusMeta(deploy.status)
            return (
              <div
                key={deploy.id}
                className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4 transition-all hover:border-[var(--border-strong)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass}`} />
                    <p className="truncate font-mono text-sm font-medium text-[var(--text-main)]">
                      {deploy.version}
                    </p>
                    <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2.5 font-mono text-[10px] text-[var(--text-soft)]">
                  <span>{deploy.environmentName}</span>
                  <span className="h-3 w-px bg-[var(--border-soft)]" />
                  <span>{deploy.deployedBy ?? 'Unknown'}</span>
                  <span className="h-3 w-px bg-[var(--border-soft)]" />
                  <span>{timeAgo(deploy.deployedAt)}</span>
                </div>
                {deploy.description && (
                  <p className="mt-1.5 text-xs text-[var(--text-muted)]">{deploy.description}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
