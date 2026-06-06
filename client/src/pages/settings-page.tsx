import { useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  BellRing,
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Link,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { sanitizeError } from '@/lib/utils'
import { Spinner } from '@/components/spinner'
import { useAuth } from '@/hooks/use-auth'
import { getToken } from '@/hooks/use-auth'
import {
  useUpdateWorkspace,
  useWorkspaces,
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: typeof User
  children: React.ReactNode
}) {
  return (
    <div className="border border-[var(--border-soft)]">
      <div className="flex items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4">
        <Icon className="h-4 w-4 text-[var(--text-muted)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--text-main)]">{title}</p>
          <p className="text-xs text-[var(--text-muted)]">{description}</p>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  type?: string
}

function Field({ label, value, onChange, readOnly, type = 'text' }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)] read-only:text-[var(--text-muted)] read-only:cursor-not-allowed"
      />
    </div>
  )
}

function ProfileSection() {
  const { state } = useAuth()
  if (state.status !== 'authenticated') return null
  const user = state.user

  return (
    <Section title="Profile" description="Your name and email address" icon={User}>
      <div className="space-y-4">
        <Field label="Name" value={user.name ?? ''} readOnly />
        <Field label="Email" value={user.email} readOnly />
      </div>
    </Section>
  )
}

function WorkspaceSection() {
  const { data: workspaces, isLoading, isError, error } = useWorkspaces()
  const workspace = workspaces?.[0]
  const { mutateAsync: updateWorkspace, isPending: updating } =
    useUpdateWorkspace()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!workspace || !name.trim()) return
    await updateWorkspace({ id: workspace.id, name: name.trim() })
    setEditing(false)
  }

  const handleCancel = () => {
    setName(workspace?.name ?? '')
    setEditing(false)
  }

  if (isLoading) {
    return (
      <Section title="Workspace" description="Your current workspace" icon={Key}>
        <p className="text-sm text-[var(--text-muted)]">Loading workspace…</p>
      </Section>
    )
  }

  if (isError) {
    return (
      <Section title="Workspace" description="Your current workspace" icon={Key}>
        <p className="text-sm text-[var(--dot-down)]">
          Failed to load workspace: {error instanceof Error ? error.message : 'Connection error'}
        </p>
      </Section>
    )
  }

  if (!workspace) {
    return (
      <Section title="Workspace" description="Your current workspace" icon={Key}>
        <p className="text-sm text-[var(--text-muted)]">No workspace found.</p>
      </Section>
    )
  }

  return (
    <Section title="Workspace" description="Your current workspace" icon={Key}>
      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <Field
            label="Workspace name"
            value={name}
            onChange={setName}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updating || !name.trim()}
              className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-40"
            >
              {updating ? <Spinner /> : <Check className="h-3 w-3" />}
              {updating ? 'Saving\u2026' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <Field label="Workspace name" value={workspace.name} readOnly />
          <button
            onClick={() => {
              setName(workspace.name)
              setEditing(true)
            }}
            className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
      )}
    </Section>
  )
}

function IntegrationsSection() {
  const integrations = [
    { name: 'Slack', description: 'Send alerts to Slack channels.', icon: BellRing },
    { name: 'Microsoft Teams', description: 'Route notifications to Teams.', icon: BellRing },
    { name: 'Webhooks', description: 'Custom HTTP callbacks for alert routing.', icon: Link },
  ]

  return (
    <Section title="Integrations" description="Webhook and chat platform connections" icon={Link}>
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between gap-4 border border-[var(--border-soft)] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <integration.icon className="h-4 w-4 text-[var(--text-muted)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-main)]">{integration.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{integration.description}</p>
              </div>
            </div>
            <button
              disabled
              className="border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] opacity-40 cursor-not-allowed"
            >
              Coming soon
            </button>
          </div>
        ))}
      </div>
    </Section>
  )
}

function ApiKeysSection() {
  const { project } = useSelectedProject()
  const { data: keys, isLoading } = useApiKeys(project?.id ?? '')
  const { mutateAsync: createKey, isPending: creating } = useCreateApiKey()
  const { mutateAsync: revokeKey } = useRevokeApiKey()
  const [newName, setNewName] = useState('')
  const [showKey, setShowKey] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!project || !newName.trim()) return
    const result = await createKey({ projectId: project.id, name: newName.trim() })
    setShowKey(result.key)
    setNewName('')
  }

  const handleCopy = (key: string) => {
    void navigator.clipboard.writeText(key)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!project) return null

  return (
    <Section title="API Keys" description="Project-level keys for SDK and CI/CD authentication" icon={Key}>
      <div className="space-y-4">
        {/* Create new key */}
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. CI pipeline, staging server"
            className="flex-1 border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)] placeholder:text-[var(--text-soft)]"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
            {creating && <Spinner />}
            {creating ? 'Generating\u2026' : 'Generate'}
          </button>
        </form>

        {/* Show newly created key */}
        {showKey && (
          <div className="border border-[var(--dot-healthy)]/30 bg-[var(--dot-healthy)]/5 px-4 py-3">
            <p className="text-xs font-semibold text-[var(--dot-healthy)] uppercase tracking-wider">Key created</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Copy this key now — you won&rsquo;t be able to see it again.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate border border-[var(--border-soft)] bg-[var(--surface-page)] px-2 py-1 text-xs font-mono text-[var(--text-main)]">
                {showKey}
              </code>
              <button
                onClick={() => handleCopy(showKey)}
                className="flex items-center gap-1 border border-[var(--border-soft)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
              >
                <Copy className="h-3 w-3" />
                {copied === showKey ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Key list */}
        {isLoading ? (
          <p className="text-xs text-[var(--text-muted)]">Loading keys…</p>
        ) : keys && keys.length > 0 ? (
          <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
            {keys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-main)]">{apiKey.name}</p>
                    {apiKey.isRevoked && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--dot-down)] border border-[var(--dot-down)]/30">
                        Revoked
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-soft)] font-mono">{apiKey.prefix}…</p>
                  {apiKey.lastUsedAt && (
                    <p className="mt-0.5 text-[10px] text-[var(--text-soft)]">
                      Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!apiKey.isRevoked && (
                    <button
                      onClick={() => revokeKey({ id: apiKey.id, projectId: project.id })}
                      className="flex items-center gap-1 border border-[var(--border-soft)] px-2 py-1 text-[10px] text-[var(--dot-down)] hover:bg-[var(--surface-panel-soft)]"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-soft)]">No API keys yet. Create one above.</p>
        )}
      </div>
    </Section>
  )
}

function DangerSection() {
  const { signOut } = useAuth()
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault()
    if (confirm !== 'DELETE') return

    setDeleting(true)
    setError('')

    try {
      const token = getToken()
      const serverOrigin = new URL(
        import.meta.env.VITE_API_URL ?? 'http://localhost:8080/graphql',
      ).origin
      const res = await fetch(`${serverOrigin}/auth/account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to delete account')
      }

      setDone(true)
      setTimeout(() => signOut(), 1500)
    } catch (err) {
      setError(sanitizeError(err))
    } finally {
      setDeleting(false)
    }
  }

  if (done) {
    return (
      <Section
        title="Account deleted"
        description="Your data has been removed"
        icon={AlertTriangle}
      >
        <p className="text-sm text-[var(--text-muted)]">
          Your account and all associated data have been deleted. Signing out…
        </p>
      </Section>
    )
  }

  return (
    <Section title="Danger zone" description="Irreversible account deletion" icon={AlertTriangle}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded border border-[var(--dot-down)]/30 bg-[var(--dot-down)]/5 p-4">
          <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dot-down)]" />
          <div>
            <p className="text-sm font-medium text-[var(--dot-down)]">
              Delete your account
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              This will permanently delete your account, workspaces, projects,
              monitors, and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        <form onSubmit={handleDelete} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Type <span className="text-[var(--dot-down)]">DELETE</span> to confirm
            </label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--dot-down)] placeholder:text-[var(--text-soft)]"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--dot-down)]">{error}</p>
          )}
          <button
            type="submit"
            disabled={confirm !== 'DELETE' || deleting}
            className="flex items-center gap-2 border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting && <Spinner />}
            {deleting ? 'Deleting\u2026' : 'Delete my account'}
          </button>
        </form>
      </div>
    </Section>
  )
}

export function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <ProfileSection />
      <WorkspaceSection />
      <ApiKeysSection />
      <IntegrationsSection />
      <DangerSection />
    </div>
  )
}
