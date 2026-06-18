import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { parseGraphqlError } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, Check, MessageSquare, Siren, Trash2, GitBranch, Lightbulb, Loader2 } from 'lucide-react'
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

const SEVERITY_STYLES: Record<string, { color: string }> = {
  CRITICAL: { color: '#dc2626' },
  HIGH: { color: '#d97706' },
  MEDIUM: { color: 'var(--text-muted)' },
  LOW: { color: '#22c55e' },
}

const UPDATE_KIND_LABELS: Record<string, string> = {
  created: 'Created',
  note: 'Note',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
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
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">Incident not found</p>
        <button
          onClick={() => navigate('/app/incidents')}
          className="mt-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to incidents
        </button>
      </div>
    )
  }

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
      <button
        onClick={() => navigate('/app/incidents')}
        className="mb-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to incidents
      </button>

      <div className="mb-6 border border-[var(--border-soft)] p-5">
        <div className="mb-3 flex items-center gap-3">
          <span
            className="border border-[var(--border-soft)] px-2 py-1 text-xs"
            style={SEVERITY_STYLES[incident.severity] ?? SEVERITY_STYLES.MEDIUM}
          >
            {incident.severity}
          </span>
          <span
            className={`border px-2 py-1 text-xs ${
              incident.status === 'OPEN'
                ? 'border-[var(--dot-down)] text-[var(--dot-down)]'
                : 'border-[var(--border-soft)] text-[var(--text-muted)]'
            }`}
          >
            {incident.status}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">{incident.title}</h2>
          <button
            onClick={async () => {
              await deleteIncident(incident.id)
              navigate('/app/incidents')
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--text-muted)] hover:text-[var(--dot-down)]"
            title="Delete incident"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {incident.summary && (
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{incident.summary}</p>
        )}
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Opened {new Date(incident.startedAt).toLocaleString()}
          {incident.resolvedAt ? ` · Resolved ${new Date(incident.resolvedAt).toLocaleString()}` : ''}
        </p>
      </div>

      {correlation && (
        <div className="mb-6 border border-[var(--border-soft)] p-5">
          <div className="mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-main)]">
              Deployment correlation
            </p>
          </div>
          <p className="text-sm leading-6 text-[var(--text-muted)]">{correlation.narrative}</p>
          {correlation.relatedDeployments.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-[var(--text-soft)]">
                Related deployments
              </p>
              {correlation.relatedDeployments.map((d) => (
                <p key={d.id} className="text-xs text-[var(--text-muted)]">
                  {d.version} · {d.environmentName}{d.serviceName ? ` · ${d.serviceName}` : ''} · {new Date(d.deployedAt).toLocaleString()}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {!rootCause && !rootCauseLoading && (
        <div className="mb-6">
          <button
            onClick={async () => {
              const result = await generateRootCause(incident.id)
              if (result) setRootCause(result)
            }}
            className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
          >
            <Lightbulb className="h-4 w-4" />
            Analyze root cause with AI
          </button>
        </div>
      )}

      {rootCauseLoading && (
        <div className="mb-6 flex items-center gap-3 border border-[var(--border-soft)] px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">Analyzing incident data…</p>
        </div>
      )}

      {rootCause && (
        <div className="mb-6 border border-[var(--border-soft)] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[var(--dot-degraded)]" />
            <p className="text-sm font-semibold text-[var(--text-main)]">
              Root cause analysis
            </p>
          </div>
          <p className="text-sm leading-6 text-[var(--text-muted)]">{rootCause.narrative}</p>

          {rootCause.possibleCauses.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-[var(--text-soft)]">
                Possible causes
              </p>
              <ul className="list-disc space-y-1 pl-4">
                {rootCause.possibleCauses.map((cause, i) => (
                  <li key={i} className="text-xs text-[var(--text-muted)]">{cause}</li>
                ))}
              </ul>
            </div>
          )}

          {rootCause.suggestions.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-[var(--text-soft)]">
                Suggestions
              </p>
              <ul className="list-disc space-y-1 pl-4">
                {rootCause.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-[var(--text-muted)]">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {rootCause.relatedDeploymentId && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Related deployment ID: {rootCause.relatedDeploymentId}
            </p>
          )}
        </div>
      )}

      {incident.status === 'OPEN' && (
        <div className="mb-6 space-y-3">
          <button
            onClick={() => setShowResolve(!showResolve)}
            className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
          >
            <Check className="h-4 w-4" />
            {showResolve ? 'Cancel' : 'Resolve incident'}
          </button>

          {showResolve && (
            <form onSubmit={handleResolve} className="border border-[var(--border-soft)] p-5">
              <textarea
                placeholder="Resolution summary (optional)"
                value={resolveSummary}
                onChange={(e) => setResolveSummary(e.target.value)}
                rows={3}
                className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
              >
                <Check className="h-4 w-4" />
                Resolve
              </button>
            </form>
          )}
        </div>
      )}

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-main)]">Timeline</h3>
        {allUpdates.length === 0 && !updatesLoading ? (
          <div className="flex flex-col items-center justify-center border border-[var(--border-soft)] py-12">
            <Siren className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">No updates yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
            {allUpdates.map((update) => (
              <div key={update.id} className="px-5 py-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="border border-[var(--border-soft)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    {UPDATE_KIND_LABELS[update.kind] ?? update.kind}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(update.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-main)]">{update.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {incident.status === 'OPEN' && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-main)]">Add update</h3>
          <form onSubmit={handleAddUpdate} className="border border-[var(--border-soft)] p-5">
            <select
              value={updateKind}
              onChange={(e) => setUpdateKind(e.target.value)}
              className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
            >
              <option value="note">Note</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
            </select>
            <textarea
              placeholder="Update description"
              value={updateBody}
              onChange={(e) => setUpdateBody(e.target.value)}
              rows={3}
              required
              className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <MessageSquare className="h-4 w-4" />
              Post update
            </button>
            {mutationError && (
              <div className="mt-3 space-y-0.5">
                {mutationError.map((msg, i) => (
                  <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
                ))}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
}
