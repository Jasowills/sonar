import { Check, Copy, Layers, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import {
  useDeleteEnvironment,
  useEnvironments,
  useUpdateEnvironment,
} from '@/lib/api'
import { PageNotice } from '@/components/page-notice'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { CreateEnvironmentModal } from '@/features/create/create-environment-modal'

export function EnvironmentsPage() {
  const { project } = useSelectedProject()
  const { data: environments, isLoading, isError, refetch } = useEnvironments(project?.slug)
  const { mutateAsync: updateEnv } = useUpdateEnvironment()
  const { mutateAsync: deleteEnv } = useDeleteEnvironment()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (key: string) => {
    void navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSave = async (id: string) => {
    if (!editName.trim()) return
    await updateEnv({ id, name: editName.trim() })
    setEditingId(null)
  }

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading environments…" />
  }

  if (isError || !environments) {
    return (
      <PageNotice
        variant="error"
        message="Could not reach the API."
        onRetry={() => void refetch()}
      />
    )
  }

  if (environments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Layers className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">No environments yet</p>
        <p className="mt-1 max-w-sm text-center text-sm text-[var(--text-muted)]">
          Create environments like production and staging to organize your monitors.
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="mt-5 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <Plus className="h-4 w-4" />
          Create environment
        </button>
        {project && (
          <CreateEnvironmentModal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            projectId={project.id}
          />
        )}
      </div>
    )
  }

  return (
    <>
      <div className="border border-[var(--border-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-main)]">Environments</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
          >
            <Plus className="h-3 w-3" />
            Create
          </button>
        </div>

        <div className="divide-y divide-[var(--border-soft)]">
          {environments.map((env) => (
            <div key={env.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: env.color ?? 'var(--text-muted)' }}
                  />
                  <div className="min-w-0">
                    {editingId === env.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-40 border border-[var(--border-soft)] bg-[var(--surface-panel)] px-2 py-1 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
                        />
                        <button
                          onClick={() => handleSave(env.id)}
                          className="flex items-center gap-1 border border-[var(--border-soft)] px-2 py-1 text-[10px] text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
                        >
                          <Check className="h-3 w-3" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 border border-[var(--border-soft)] px-2 py-1 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-main)]">{env.name}</p>
                        <span className="text-[10px] font-mono text-[var(--text-soft)]">{env.key}</span>
                        <button
                          onClick={() => handleCopy(env.key)}
                          className="flex items-center gap-1 border border-[var(--border-soft)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                        >
                          {copiedKey === env.key ? (
                            <>
                              <Check className="h-2.5 w-2.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-2.5 w-2.5" />
                              Key
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {editingId !== env.id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(env.id)
                          setEditName(env.name)
                        }}
                        className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
                        title="Edit environment"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setDeletingId(env.id)}
                        className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--dot-down)]"
                        title="Delete environment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {project && (
        <CreateEnvironmentModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          projectId={project.id}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm border border-[var(--border-soft)] bg-[var(--surface-page)]">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">Delete environment</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-[var(--text-muted)]">
                Are you sure you want to delete this environment? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    void deleteEnv(deletingId)
                    setDeletingId(null)
                  }}
                  className="border border-[var(--dot-down)] px-4 py-2 text-sm text-[var(--dot-down)] hover:bg-[var(--dot-down)]/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
