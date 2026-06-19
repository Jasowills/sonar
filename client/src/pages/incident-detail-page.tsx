import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { parseGraphqlError } from '@/lib/utils'
import {
  ArrowLeft, AlertTriangle, MessageSquare, Trash2, GitBranch, Lightbulb, Loader2, Check, Clock,
} from 'lucide-react'
import {
  useIncidents,
  useIncidentUpdates,
  useResolveIncident,
  useAddIncidentUpdate,
  useDeleteIncident,
  useIncidentCorrelation,
  useGenerateIncidentRootCause,
} from '@/lib/api'
import type { IncidentRootCause } from '@/lib/api'

const SEVERITY_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  CRITICAL: { color: '#dc2626', dot: 'bg-red-500', label: 'Critical' },
  HIGH: { color: '#d97706', dot: 'bg-amber-500', label: 'High' },
  MEDIUM: { color: 'var(--text-muted)', dot: 'bg-[var(--text-muted)]', label: 'Medium' },
  LOW: { color: '#22c55e', dot: 'bg-green-500', label: 'Low' },
}

const KIND_CONFIG: Record<string, { dot: string; label: string }> = {
  created: { dot: 'bg-[var(--accent)]', label: 'Created' },
  identified: { dot: 'bg-amber-500', label: 'Identified' },
  monitoring: { dot: 'bg-blue-500', label: 'Monitoring' },
  resolved: { dot: 'bg-emerald-500', label: 'Resolved' },
  note: { dot: 'bg-[var(--text-soft)]', label: 'Note' },
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

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: incidents } = useIncidents()
  const incident = incidents?.find((i) => i.id === id)
  const { data: updates, isLoading: updatesLoading } = useIncidentUpdates(id ?? '')
  const { mutateAsync: resolveIncident } = useResolveIncident()
  const { mutateAsync: addUpdate } = useAddIncidentUpdate()
  const { mutateAsync: deleteIncident } = useDeleteIncident()
  const [updateKind, setUpdateKind] = useState('note')
  const [updateBody, setUpdateBody] = useState('')
  const [resolveSummary, setResolveSummary] = useState('')
  const [showResolve, setShowResolve] = useState(false)
  const [mutationError, setMutationError] = useState<string[] | null>(null)
  const { data: correlation } = useIncidentCorrelation(id)
  const { mutateAsync: generateRootCause, isPending: rootCauseLoading } = useGenerateIncidentRootCause()
  const [rootCause, setRootCause] = useState<IncidentRootCause | null>(null)

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">Incident not found</p>
        <button
          onClick={() => navigate('/app/incidents')}
          className="mt-4 flex items-center gap-1.5 rounded-md border border-[var(--border-soft)] px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to signals
        </button>
      </div>
    )
  }

  const sev = SEVERITY_CONFIG[incident.severity] ?? SEVERITY_CONFIG.MEDIUM
  const isOpen = incident.status === 'OPEN'

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await addUpdate({ incidentId: id, kind: updateKind, body: updateBody })
      setUpdateBody('')
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await resolveIncident({ id, summary: resolveSummary || undefined })
      setShowResolve(false)
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const allUpdates = [
    {
      id: 'created',
      kind: 'created',
      body: incident.summary || incident.title,
      createdAt: incident.createdAt,
      isInitial: true as const,
    },
    ...(updates ?? []),
  ]

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => navigate('/app/incidents')}
        className="mb-6 flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to signals
      </button>

      {/* Header banner */}
      <div
        className="mb-8 overflow-hidden rounded-lg border border-[var(--border-soft)]"
      >
        {/* Status bar */}
        <div
          className={`flex items-center gap-3 px-6 py-3 ${
            isOpen
              ? 'bg-amber-500/5 border-b border-amber-500/10'
              : 'bg-emerald-500/5 border-b border-emerald-500/10'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {isOpen ? 'Active signal' : 'Resolved'}
          </span>
          <span className="h-3 w-px bg-[var(--border-soft)]" />
          <span className="font-mono text-[10px] text-[var(--text-soft)]">
            Opened {timeAgo(incident.startedAt)}
          </span>
          {incident.resolvedAt && (
            <>
              <span className="font-mono text-[10px] text-[var(--text-soft)]">·</span>
              <span className="font-mono text-[10px] text-[var(--text-soft)]">
                Resolved {timeAgo(incident.resolvedAt)}
              </span>
            </>
          )}
        </div>

        <div className="bg-[var(--surface-panel)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 shrink-0 rounded-full ${sev.dot} ${isOpen ? 'animate-pulse' : ''}`} />
                <h1 className="text-lg font-semibold text-[var(--text-main)]">{incident.title}</h1>
              </div>
              {incident.summary && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{incident.summary}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="rounded-full border px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider"
                style={{
                  borderColor: `${sev.color}40`,
                  color: sev.color,
                  backgroundColor: `${sev.color}08`,
                }}
              >
                {incident.severity}
              </span>
              <button
                onClick={async () => {
                  await deleteIncident(incident.id)
                  navigate('/app/incidents')
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-danger)] hover:text-[var(--dot-down)]"
                title="Delete signal"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main column */}
        <div>
          {/* Resolve banner */}
          {isOpen && (
            <div className="mb-6 overflow-hidden rounded-lg border border-[var(--border-soft)]">
              <button
                onClick={() => setShowResolve(!showResolve)}
                className="flex w-full items-center justify-between bg-[var(--surface-panel)] px-5 py-3 text-left text-sm font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Resolve this incident
                </div>
                <span className="font-mono text-[10px] text-[var(--text-soft)]">
                  {showResolve ? 'Close' : 'Add resolution'}
                </span>
              </button>
              {showResolve && (
                <form onSubmit={handleResolve} className="border-t border-[var(--border-soft)] bg-[var(--surface-page)] px-5 py-4">
                  <textarea
                    placeholder="Resolution summary (optional)"
                    value={resolveSummary}
                    onChange={(e) => setResolveSummary(e.target.value)}
                    rows={2}
                    className="mb-3 w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Confirm resolve
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResolve(false)}
                      className="rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Root cause analysis */}
          {!rootCause && !rootCauseLoading && (
            <div className="mb-6">
              <button
                onClick={async () => {
                  const result = await generateRootCause(incident.id)
                  if (result) setRootCause(result)
                }}
                className="flex items-center gap-2 rounded-md border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-main)] transition-all"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Analyze root cause with AI
              </button>
            </div>
          )}

          {rootCauseLoading && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">Analyzing incident data…</p>
            </div>
          )}

          {rootCause && (
            <div className="mb-6 overflow-hidden rounded-lg border border-amber-500/20 bg-[var(--surface-panel)]">
              <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-5 py-3">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  Root cause analysis
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm leading-6 text-[var(--text-muted)]">{rootCause.narrative}</p>

                {rootCause.possibleCauses.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]">
                      Possible causes
                    </p>
                    <ul className="space-y-2">
                      {rootCause.possibleCauses.map((cause, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--text-soft)]" />
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rootCause.suggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]">
                      Suggestions
                    </p>
                    <ul className="space-y-2">
                      {rootCause.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rootCause.relatedDeploymentId && (
                  <p className="mt-3 font-mono text-[10px] text-[var(--text-soft)]">
                    Related deployment: {rootCause.relatedDeploymentId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-[var(--text-main)]">Timeline</h2>
            {allUpdates.length === 0 && !updatesLoading ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-soft)] py-14">
                <Clock className="mb-3 h-6 w-6 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">No updates yet</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical connecting line */}
                <div className="absolute bottom-0 left-[11px] top-0 w-px bg-[var(--border-soft)]" />

                <div className="space-y-0">
                  {allUpdates.map((update, idx) => {
                    const kindCfg = KIND_CONFIG[update.kind] ?? { dot: 'bg-[var(--text-soft)]', label: update.kind }
                    const isLast = idx === allUpdates.length - 1
                    return (
                      <div key={update.id} className="relative flex gap-4 pb-6">
                        {/* Dot */}
                        <div className="relative z-10 mt-1 flex shrink-0 flex-col items-center">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--surface-page)] ${kindCfg.dot}`}>
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--surface-page)]" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]">
                              {kindCfg.label}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--text-soft)]">
                              {timeAgo(update.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm leading-6 text-[var(--text-main)]">{update.body}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Add update */}
          {isOpen && (
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-[var(--text-main)]">Add update</h2>
              <form onSubmit={handleAddUpdate} className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)]">
                <div className="space-y-4 p-5">
                  <div className="flex gap-1.5">
                    {(['note', 'identified', 'monitoring'] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => setUpdateKind(kind)}
                        className={`rounded-md border px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider transition-all ${
                          updateKind === kind
                            ? 'border-[var(--border-strong)] bg-[var(--surface-panel-soft)] text-[var(--text-main)]'
                            : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Describe what's happening…"
                    value={updateBody}
                    onChange={(e) => setUpdateBody(e.target.value)}
                    rows={3}
                    required
                    className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]"
                  />
                  <div className="flex items-center justify-between">
                    {mutationError && (
                      <div className="space-y-0.5">
                        {mutationError.map((msg, i) => (
                          <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
                        ))}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="ml-auto flex items-center gap-1.5 rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-4 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Post update
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Correlation */}
          {correlation && (
            <div className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)]">
              <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-4 py-3">
                <GitBranch className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <p className="text-xs font-semibold text-[var(--text-main)]">
                  Deploy correlation
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs leading-5 text-[var(--text-muted)]">{correlation.narrative}</p>
                {correlation.relatedDeployments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]">
                      Related deploys
                    </p>
                    {correlation.relatedDeployments.map((d) => (
                      <div key={d.id} className="rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2">
                        <p className="font-mono text-[11px] font-medium text-[var(--text-main)]">
                          {d.version}
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] text-[var(--text-soft)]">
                          {d.environmentName}{d.serviceName ? ` · ${d.serviceName}` : ''} · {timeAgo(d.deployedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata card */}
          <div className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)]">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--text-main)]">Details</p>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="font-mono text-[10px] text-[var(--text-soft)]">Status</span>
                <span className={`font-mono text-[10px] font-medium uppercase tracking-wider ${isOpen ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {incident.status}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="font-mono text-[10px] text-[var(--text-soft)]">Severity</span>
                <span
                  className="font-mono text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: sev.color }}
                >
                  {incident.severity}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="font-mono text-[10px] text-[var(--text-soft)]">Started</span>
                <span className="font-mono text-[10px] text-[var(--text-main)]">
                  {new Date(incident.startedAt).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              {incident.resolvedAt && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-mono text-[10px] text-[var(--text-soft)]">Resolved</span>
                  <span className="font-mono text-[10px] text-[var(--text-main)]">
                    {new Date(incident.resolvedAt).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="font-mono text-[10px] text-[var(--text-soft)]">Updates</span>
                <span className="font-mono text-[10px] text-[var(--text-main)]">{allUpdates.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
