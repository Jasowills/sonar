import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sanitizeError, parseGraphqlError } from '@/lib/utils'
import { AlertTriangle, Plus, Check, X, Loader2 } from 'lucide-react'
import {
  useIncidents,
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
  useWorkspaces,
  useProjects,
} from '@/lib/api'

const SEVERITY_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  CRITICAL: { color: '#dc2626', dot: 'bg-red-500', label: 'Critical' },
  HIGH: { color: '#d97706', dot: 'bg-amber-500', label: 'High' },
  MEDIUM: { color: 'var(--text-muted)', dot: 'bg-[var(--text-muted)]', label: 'Medium' },
  LOW: { color: '#22c55e', dot: 'bg-green-500', label: 'Low' },
}

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export function IncidentsPage() {
  const navigate = useNavigate()
  const { data: incidents, isLoading, error } = useIncidents()
  const { mutateAsync: createIncident } = useCreateIncident()
  const { mutateAsync: updateIncident } = useUpdateIncident()
  const { mutateAsync: deleteIncident } = useDeleteIncident()
  const { data: workspaces } = useWorkspaces()
  const { data: projects } = useProjects()
  const workspaceId = workspaces?.[0]?.id
  const projectId = projects?.[0]?.id
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState('MEDIUM')
  const [summary, setSummary] = useState('')
  const [mutationError, setMutationError] = useState<string[] | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL')

  const openCount = incidents?.filter((i) => i.status === 'OPEN').length ?? 0
  const resolvedCount = incidents?.filter((i) => i.status === 'RESOLVED').length ?? 0

  const filtered = !incidents ? [] : filter === 'ALL' ? incidents : incidents.filter((i) => i.status === filter)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-4 rounded-lg border border-[var(--border-soft)] px-5 py-4"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
          >
            <div className="h-12 w-1 shrink-0 rounded-full bg-[var(--border-soft)]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-3/5 rounded bg-[var(--border-soft)]" />
              <div className="h-3 w-1/4 rounded bg-[var(--border-soft)]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-full bg-[var(--border-soft)]" />
              <div className="h-5 w-14 rounded-full bg-[var(--border-soft)]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-soft)] py-20">
        <AlertTriangle className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">Failed to load incidents</p>
        <p className="mt-1 max-w-md text-center text-xs text-[var(--text-muted)]">
          {sanitizeError(error)}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md border border-[var(--border-soft)] px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
        >
          Retry
        </button>
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

  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updateIncident({ id, status: 'RESOLVED' })
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: 'ALL', label: 'All signals', count: incidents?.length ?? 0 },
    { key: 'OPEN', label: 'Open', count: openCount },
    { key: 'RESOLVED', label: 'Resolved', count: resolvedCount },
  ]

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)] p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-[var(--surface-page)] text-[var(--text-main)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  filter === f.key
                    ? 'bg-[var(--surface-panel-soft)] text-[var(--text-soft)]'
                    : 'bg-[var(--surface-panel)] text-[var(--text-soft)]'
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
            showForm
              ? 'border-[var(--border-strong)] bg-[var(--surface-panel-soft)] text-[var(--text-main)]'
              : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-main)]'
          }`}
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'New signal'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)]"
        >
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
                Title
              </label>
              <input
                type="text"
                placeholder="e.g. Checkout latency spike"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
                  Severity
                </label>
                <div className="flex gap-1.5">
                  {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all ${
                        severity === s
                          ? 'border-[var(--border-strong)] bg-[var(--surface-panel-soft)] text-[var(--text-main)]'
                          : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_CONFIG[s].dot}`} />
                      {SEVERITY_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
                Summary
              </label>
              <textarea
                placeholder="What happened?"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]"
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
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-4 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
              >
                <Check className="h-3.5 w-3.5" />
                Create signal
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Empty state */}
      {filtered.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-soft)] py-20">
          <div className="relative mb-4 flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-[var(--border-soft)] opacity-20" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-soft)]">
              <div className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--text-main)]">No signals</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {filter === 'ALL'
              ? 'Incidents appear here when monitors trigger alerts.'
              : `No ${filter.toLowerCase()} incidents.`}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 flex items-center gap-1.5 rounded-md border border-[var(--border-soft)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-main)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Create the first signal
          </button>
        </div>
      )}

      {/* Signal list */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((incident) => {
            const sev = SEVERITY_CONFIG[incident.severity] ?? SEVERITY_CONFIG.MEDIUM
            const isOpen = incident.status === 'OPEN'
            return (
              <div
                key={incident.id}
                onClick={() => navigate(`/app/incidents/${incident.id}`)}
                className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4 transition-all hover:border-[var(--border-strong)] hover:shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${sev.dot} ${isOpen ? 'animate-pulse' : ''}`} />
                    <p className="truncate text-sm font-medium text-[var(--text-main)]">
                      {incident.title}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2.5 text-xs text-[var(--text-soft)]">
                    <span className="font-mono text-[10px]">{timeAgo(incident.startedAt)}</span>
                    <span className="h-3 w-px bg-[var(--border-soft)]" />
                    <span className="font-mono text-[10px]">
                      {new Date(incident.startedAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Severity badge */}
                  <span
                    className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
                    style={{
                      borderColor: `${sev.color}40`,
                      color: sev.color,
                    }}
                  >
                    {incident.severity}
                  </span>

                  {/* Status badge */}
                  {isOpen ? (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-amber-500">
                      Open
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-emerald-500">
                      Resolved
                    </span>
                  )}

                  {/* Resolve button */}
                  {isOpen && (
                    <button
                      onClick={(e) => handleResolve(incident.id, e)}
                      className="ml-1 rounded-md border border-transparent px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] opacity-0 transition-all hover:border-[var(--border-soft)] hover:bg-emerald-500/10 hover:text-emerald-500 group-hover:opacity-100"
                      title="Resolve incident"
                    >
                      Resolve
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void deleteIncident(incident.id)
                    }}
                    className="ml-1 flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition-all hover:bg-[var(--surface-danger)] hover:text-[var(--dot-down)] group-hover:opacity-100"
                    title="Delete signal"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
