import { useState } from 'react'
import { sanitizeError, parseGraphqlError } from '@/lib/utils'
import { AlertTriangle, LifeBuoy, Plus, Trash2 } from 'lucide-react'
import { useStatusPages, useCreateStatusPage, useDeleteStatusPage, useWorkspaces } from '@/lib/api'

export function StatusPagesPage() {
  const { data: statusPages, isLoading, error } = useStatusPages()
  const { mutateAsync: createStatusPage } = useCreateStatusPage()
  const { mutateAsync: deleteStatusPage } = useDeleteStatusPage()
  const { data: workspaces } = useWorkspaces()
  const workspace = workspaces?.[0]
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [mutationError, setMutationError] = useState<string[] | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[var(--text-muted)]">Loading status pages…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">Failed to load status pages</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {sanitizeError(error)}
        </p>
      </div>
    )
  }

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this status page?')) {
      try {
        await deleteStatusPage(id)
        setMutationError(null)
      } catch (err) {
        setMutationError(parseGraphqlError(err))
      }
    }
  }

  const hasPages = statusPages && statusPages.length > 0

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {mutationError && (
        <div className="col-span-full mb-2 space-y-0.5">
          {mutationError.map((msg, i) => (
            <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
          ))}
        </div>
      )}
      <div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          {showForm ? null : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Create status page'}
        </button>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-4 border border-[var(--border-soft)] p-5">
            <input
              type="text"
              placeholder="Page name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <input
              type="text"
              placeholder="Headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Plus className="h-4 w-4" />
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

        {!hasPages && !showForm ? (
          <div className="flex flex-col items-center justify-center border border-[var(--border-soft)] py-16">
            <LifeBuoy className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-lg font-semibold text-[var(--text-main)]">No status pages</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Create a public status page to communicate with your users.
            </p>
          </div>
        ) : hasPages ? (
          <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
            {statusPages.map((page) => (
              <div
                key={page.id}
                className="flex items-start justify-between gap-4 px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-main)]">{page.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{page.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-2 py-1 text-xs text-[var(--text-muted)]">
                    {page.visibility}
                  </span>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="border border-[var(--border-soft)] px-2 py-1 text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <section className="border border-[var(--border-soft)] p-5 h-fit">
        <p className="text-sm font-semibold text-[var(--text-main)]">About status pages</p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          Public status pages show real-time service state for your users. Each page
          maps to a dedicated subdomain and can display the health of selected services.
        </p>
      </section>
    </div>
  )
}
