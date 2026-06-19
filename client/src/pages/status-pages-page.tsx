import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sanitizeError, parseGraphqlError } from '@/lib/utils'
import { AlertTriangle, Plus, ExternalLink, Settings, Radio, Loader2, Globe, Lock, ChevronRight } from 'lucide-react'
import { useStatusPages, useCreateStatusPage, useWorkspaces } from '@/lib/api'
import { Button } from '@/components/ui/button'

const LABEL_CLS = 'font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]'

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

export function StatusPagesPage() {
  const navigate = useNavigate()
  const { data: statusPages, isLoading, error } = useStatusPages()
  const { mutateAsync: createStatusPage } = useCreateStatusPage()
  const { data: workspaces } = useWorkspaces()
  const workspace = workspaces?.[0]
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [mutationError, setMutationError] = useState<string[] | null>(null)

  const clientUrl = import.meta.env.VITE_CLIENT_URL ?? 'http://localhost:3000'
  const workspaceSlug = workspace?.slug

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!workspace) return
      await createStatusPage({ name, headline, workspaceId: workspace.id })
      setName('')
      setHeadline('')
      setShowForm(false)
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-5 w-40 rounded bg-[var(--border-soft)] animate-pulse" />
          <div className="mt-2 h-4 w-72 rounded bg-[var(--border-soft)] animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)]"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
            >
              <div className="h-1 w-full rounded-t-lg bg-[var(--border-soft)]" />
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--border-soft)]" />
                  <div className="h-4 w-24 rounded bg-[var(--border-soft)]" />
                </div>
                <div className="h-3 w-full rounded bg-[var(--border-soft)]" />
                <div className="h-3 w-3/5 rounded bg-[var(--border-soft)]" />
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-7 w-7 rounded-md bg-[var(--border-soft)]" />
                  <div className="h-7 w-7 rounded-md bg-[var(--border-soft)]" />
                  <div className="ml-auto h-5 w-16 rounded-full bg-[var(--border-soft)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)] py-20">
        <AlertTriangle className="mb-4 h-10 w-10 text-[var(--dot-down)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">Failed to load status pages</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{sanitizeError(error)}</p>
      </div>
    )
  }

  const hasPages = statusPages && statusPages.length > 0

  return (
    <div>
      {mutationError && (
        <div className="mb-6 rounded-lg border border-[var(--dot-down)]/20 bg-[var(--dot-down)]/5 px-4 py-3">
          <p className={LABEL_CLS}>Error</p>
          {mutationError.map((msg, i) => (
            <p key={i} className="text-sm text-[var(--dot-down)]">{msg}</p>
          ))}
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          {hasPages && (
            <p className="text-xs leading-none text-[var(--text-soft)]">
              {statusPages.length} {statusPages.length === 1 ? 'page' : 'pages'}
            </p>
          )}
        </div>
        <Button variant="default" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? null : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'New Status Page'}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5"
        >
          <p className={LABEL_CLS}>Create Status Page</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Page name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Headline (optional)"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]"
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" variant="default" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Create
            </Button>
          </div>
        </form>
      )}

      {!hasPages && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-soft)] bg-[var(--surface-panel)] py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-soft)]">
            <Radio className="h-6 w-6 text-[var(--text-soft)]" />
          </div>
          <p className="text-lg font-semibold text-[var(--text-main)]">No status pages yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Create your first public status page to communicate with users.
          </p>
          <Button
            variant="default"
            size="sm"
            className="mt-5"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Status Page
          </Button>
        </div>
      ) : hasPages ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statusPages.map((page, i) => (
            <div
              key={page.id}
              onClick={() => navigate(`/app/status-pages/${page.id}`)}
              className="group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)] transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-md"
              style={{
                animation: 'fadeSlideUp 0.35s ease-out both',
                animationDelay: `${i * 60}ms`,
              }}
            >
              {/* top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-[var(--text-muted)]/10 to-transparent" />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--text-muted)]" />
                      <p className="truncate text-sm font-medium text-[var(--text-main)]">
                        {page.name}
                      </p>
                    </div>
                    {page.headline && (
                      <p className="mt-1 truncate text-xs text-[var(--text-soft)]">
                        {page.headline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-soft)]">
                  <span className="text-[var(--text-muted)]">/</span>
                  {page.workspaceSlug}/{page.slug}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(
                        `${clientUrl}/status/${page.workspaceSlug}/${page.slug}`,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }}
                    className="rounded-md border border-[var(--border-soft)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
                    title="Open public page"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/app/status-pages/${page.id}`)
                    }}
                    className="rounded-md border border-[var(--border-soft)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
                    title="Edit page"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[var(--border-soft)] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]">
                    {page.visibility === 'PUBLIC' ? (
                      <Globe className="h-2.5 w-2.5" />
                    ) : (
                      <Lock className="h-2.5 w-2.5" />
                    )}
                    {page.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-[var(--border-soft)] pt-3">
                  <span className="text-[10px] text-[var(--text-soft)]">
                    created {timeAgo(page.createdAt)}
                  </span>
                  <ChevronRight className="ml-auto h-3 w-3 text-[var(--text-soft)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
