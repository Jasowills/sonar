import { useState } from 'react'
import { sanitizeError, parseGraphqlError } from '@/lib/utils'
import { AlertTriangle, Siren, Plus, Check } from 'lucide-react'
import { useIncidents, useCreateIncident, useUpdateIncident, useWorkspaces, useProjects } from '@/lib/api'

const SEVERITY_STYLES: Record<string, { color: string }> = {
  CRITICAL: { color: '#dc2626' },
  HIGH: { color: '#d97706' },
  MEDIUM: { color: 'var(--text-muted)' },
  LOW: { color: '#22c55e' },
}

export function IncidentsPage() {
  const { data: incidents, isLoading, error } = useIncidents()
  const { mutateAsync: createIncident } = useCreateIncident()
  const { mutateAsync: updateIncident } = useUpdateIncident()
  const { data: workspaces } = useWorkspaces()
  const { data: projects } = useProjects()
  const workspaceId = workspaces?.[0]?.id
  const projectId = projects?.[0]?.id
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState('MEDIUM')
  const [summary, setSummary] = useState('')
  const [mutationError, setMutationError] = useState<string[] | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[var(--text-muted)]">Loading incidents…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">Failed to load incidents</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {sanitizeError(error)}
        </p>
      </div>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!workspaceId || !projectId) return
      await createIncident({ title, severity, summary, workspaceId, projectId })
      setTitle('')
      setSeverity('MEDIUM')
      setSummary('')
      setShowForm(false)
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleResolve = async (id: string) => {
    try {
      await updateIncident({ id, status: 'RESOLVED' })
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const hasIncidents = incidents && incidents.length > 0

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
      >
        {showForm ? null : <Plus className="h-4 w-4" />}
        {showForm ? 'Cancel' : 'Create incident'}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 border border-[var(--border-soft)] p-5">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
          >
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <textarea
            placeholder="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
          >
            <Check className="h-4 w-4" />
            Create
          </button>
          {mutationError && (
            <div className="mt-3 space-y-0.5">
              {mutationError.map((msg, i) => (
                <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
              ))}
            </div>
          )}
        </form>
      )}

      {!hasIncidents && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Siren className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
          <p className="text-lg font-semibold text-[var(--text-main)]">No incidents</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Incidents will appear here when monitors trigger alerts.
          </p>
        </div>
      ) : hasIncidents ? (
        <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-main)]">{incident.title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Opened {new Date(incident.startedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span
                  className="border border-[var(--border-soft)] px-2 py-1"
                  style={SEVERITY_STYLES[incident.severity] ?? SEVERITY_STYLES.MEDIUM}
                >
                  {incident.severity}
                </span>
                <span className="border border-[var(--border-soft)] px-2 py-1 text-[var(--text-muted)]">
                  {incident.status}
                </span>
                {incident.status === 'OPEN' && (
                  <button
                    onClick={() => handleResolve(incident.id)}
                    className="border border-[var(--border-soft)] px-2 py-1 text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
