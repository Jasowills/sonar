import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { parseGraphqlError } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, Plus, Trash2, ExternalLink } from 'lucide-react'
import {
  useStatusPage,
  useUpdateStatusPage,
  useAddStatusPageService,
  useRemoveStatusPageService,
  useServices,
} from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  HEALTHY: { label: 'Operational', color: '#22c55e' },
  DEGRADED: { label: 'Degraded', color: '#d97706' },
  DOWN: { label: 'Down', color: '#dc2626' },
  PENDING: { label: 'Pending', color: 'var(--text-muted)' },
}

export function StatusPageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: page, isLoading, error } = useStatusPage(id ?? '')
  const { project } = useSelectedProject()
  const { data: allServices } = useServices(project?.slug)
  const { mutateAsync: updatePage } = useUpdateStatusPage()
  const { mutateAsync: addService } = useAddStatusPageService()
  const { mutateAsync: removeService } = useRemoveStatusPageService()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [mutationError, setMutationError] = useState<string[] | null>(null)

  const clientUrl = import.meta.env.VITE_CLIENT_URL ?? 'http://localhost:3000'

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[var(--text-muted)]">Loading status page…</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">Status page not found</p>
        <button
          onClick={() => navigate('/app/status-pages')}
          className="mt-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to status pages
        </button>
      </div>
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await updatePage({ id, name, headline, visibility })
      setEditing(false)
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleAddService = async () => {
    if (!id || !selectedServiceId) return
    try {
      await addService({ statusPageId: id, serviceId: selectedServiceId })
      setSelectedServiceId('')
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleRemoveService = async (serviceId: string) => {
    if (!id) return
    try {
      await removeService({ statusPageId: id, serviceId })
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const startEditing = () => {
    setName(page.name)
    setHeadline(page.headline ?? '')
    setVisibility(page.visibility)
    setEditing(true)
  }

  const linkedServiceIds = new Set(page.services.map((s) => s.serviceId))
  const availableServices = (allServices ?? []).filter((s) => !linkedServiceIds.has(s.id))

  return (
    <div>
      <button
        onClick={() => navigate('/app/status-pages')}
        className="mb-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to status pages
      </button>

      {mutationError && (
        <div className="mb-4 space-y-0.5">
          {mutationError.map((msg, i) => (
            <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
          ))}
        </div>
      )}

      <div className="mb-6 border border-[var(--border-soft)] p-5">
        {editing ? (
          <form onSubmit={handleSave}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
            />
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Headline"
              className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-main)]">{page.name}</h2>
                {page.headline && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{page.headline}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`${clientUrl}/status/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                >
                  <ExternalLink className="h-3 w-3" />
                  View public page
                </a>
                <button
                  onClick={startEditing}
                  className="border border-[var(--border-soft)] px-3 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-3 text-xs">
              <span className="border border-[var(--border-soft)] px-2 py-1 text-[var(--text-muted)]">
                /{page.slug}
              </span>
              <span className="border border-[var(--border-soft)] px-2 py-1 text-[var(--text-muted)]">
                {page.visibility}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-main)]">Services</h3>

        {page.services.length > 0 && (
          <div className="mb-4 divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
            {page.services.map((svc) => {
              const statusInfo = STATUS_LABELS[svc.status] ?? STATUS_LABELS.PENDING
              return (
                <div
                  key={svc.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm text-[var(--text-main)]">{svc.displayName ?? svc.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {svc.latencyMs != null ? `${svc.latencyMs}ms` : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="border px-2 py-0.5 text-xs"
                      style={{
                        borderColor: statusInfo.color,
                        color: statusInfo.color,
                      }}
                    >
                      {statusInfo.label}
                    </span>
                    <button
                      onClick={() => handleRemoveService(svc.serviceId)}
                      className="border border-[var(--border-soft)] px-2 py-1 text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {availableServices.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
            >
              <option value="">Select a service…</option>
              {availableServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddService}
              disabled={!selectedServiceId}
              className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Add service
            </button>
          </div>
        )}
        {availableServices.length === 0 && page.services.length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">All services are already linked to this page.</p>
        )}
      </div>
    </div>
  )
}
