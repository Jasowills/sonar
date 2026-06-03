import { Users } from 'lucide-react'
import { useMembers, useWorkspaces } from '@/lib/api'
import { sanitizeError } from '@/lib/utils'
import { PageNotice } from '@/components/page-notice'

export function TeamPage() {
  const { data: workspaces } = useWorkspaces()
  const workspace = workspaces?.[0]
  const { data: members, isLoading, isError, error } = useMembers(workspace?.id ?? '')

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Users className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">No workspace</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Create a workspace to invite team members.</p>
      </div>
    )
  }

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading team members…" />
  }

  if (isError) {
    return (
      <PageNotice
        variant="error"
        message={sanitizeError(error)}
        onRetry={() => {}}
      />
    )
  }

  if (!members || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Users className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">No members</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Invite your team to collaborate on monitoring.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border border-[var(--border-soft)] bg-[var(--surface-panel)] text-xs font-medium text-[var(--text-muted)]">
              {member.user.fullName?.charAt(0)?.toUpperCase() ?? member.user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-main)]">
                {member.user.fullName ?? member.user.email}
              </p>
              {member.user.fullName && (
                <p className="text-xs text-[var(--text-muted)]">{member.user.email}</p>
              )}
            </div>
          </div>
          <span className="border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-2 py-1 text-xs text-[var(--text-muted)]">
            {member.role}
          </span>
        </div>
      ))}
    </div>
  )
}
