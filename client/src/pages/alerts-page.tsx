import { useState } from 'react'
import { sanitizeError, parseGraphqlError } from '@/lib/utils'
import {
  AlertTriangle,
  BellRing,
  Plus,
  Trash2,
  MessageSquare,
  Globe,
  Mail,
} from 'lucide-react'
import {
  useAlertChannels,
  useAlertRules,
  useCreateAlertChannel,
  useUpdateAlertChannel,
  useDeleteAlertChannel,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useWorkspaces,
} from '@/lib/api'

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  SLACK: <MessageSquare className="h-4 w-4" />,
  WEBHOOK: <Globe className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
}

export function AlertsPage() {
  const { data: channels, isLoading: channelsLoading, error: channelsError } = useAlertChannels()
  const { data: rules, isLoading: rulesLoading } = useAlertRules()
  const { data: workspaces } = useWorkspaces()
  const { mutateAsync: createChannel } = useCreateAlertChannel()
  const { mutateAsync: updateChannel } = useUpdateAlertChannel()
  const { mutateAsync: deleteChannel } = useDeleteAlertChannel()
  const { mutateAsync: createRule } = useCreateAlertRule()
  const { mutateAsync: updateRule } = useUpdateAlertRule()
  const { mutateAsync: deleteRule } = useDeleteAlertRule()

  const workspaceId = workspaces?.[0]?.id

  const [showChannelForm, setShowChannelForm] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [channelType, setChannelType] = useState('SLACK')
  const [channelDest, setChannelDest] = useState('')

  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleName, setRuleName] = useState('')
  const [ruleTrigger, setRuleTrigger] = useState('')
  const [ruleSeverity, setRuleSeverity] = useState('MEDIUM')
  const [ruleChannelId, setRuleChannelId] = useState('')
  const [mutationError, setMutationError] = useState<string[] | null>(null)

  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null)

  if (channelsLoading || rulesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[var(--text-muted)]">Loading alert configuration…</p>
      </div>
    )
  }

  if (channelsError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">Failed to load alert channels</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {sanitizeError(channelsError)}
        </p>
      </div>
    )
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!workspaceId) return
      await createChannel({ name: channelName, type: channelType, destination: channelDest, workspaceId })
      setChannelName('')
      setChannelType('SLACK')
      setChannelDest('')
      setShowChannelForm(false)
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleToggleChannel = async (channel: { id: string; isEnabled: boolean }) => {
    try {
      await updateChannel({ id: channel.id, isEnabled: !channel.isEnabled })
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleDeleteChannel = async (id: string) => {
    setDeletingChannelId(id)
  }

  const confirmDeleteChannel = async () => {
    if (!deletingChannelId) return
    try {
      await deleteChannel(deletingChannelId)
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
    setDeletingChannelId(null)
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!workspaceId) return
      await createRule({
        name: ruleName,
        triggerType: ruleTrigger,
        minimumSeverity: ruleSeverity,
        alertChannelId: ruleChannelId,
        workspaceId,
      })
      setRuleName('')
      setRuleTrigger('')
      setRuleSeverity('MEDIUM')
      setRuleChannelId('')
      setShowRuleForm(false)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const channelById = (id: string) => channels?.find((c) => c.id === id)

  return (
    <div>
      {mutationError && (
        <div className="mb-4 space-y-0.5">
          {mutationError.map((msg, i) => (
            <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
          ))}
        </div>
      )}
      <div className="mb-2">
        <p className="text-sm font-semibold text-[var(--text-main)]">Alert Channels</p>
        <p className="text-xs text-[var(--text-muted)]">
          Configure how alerts reach your team.
        </p>
      </div>

      <button
        onClick={() => setShowChannelForm(!showChannelForm)}
        className="mb-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
      >
        {showChannelForm ? null : <Plus className="h-4 w-4" />}
        {showChannelForm ? 'Cancel' : 'Add channel'}
      </button>

      {showChannelForm && (
        <form onSubmit={handleCreateChannel} className="mb-4 border border-[var(--border-soft)] p-5">
          <input
            type="text"
            placeholder="Channel name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            required
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <select
            value={channelType}
            onChange={(e) => setChannelType(e.target.value)}
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
          >
            <option value="SLACK">Slack</option>
            <option value="WEBHOOK">Webhook</option>
            <option value="EMAIL">Email</option>
          </select>
          <input
            type={channelType === 'EMAIL' ? 'email' : 'url'}
            placeholder={channelType === 'EMAIL' ? 'email@example.com' : 'https://…'}
            value={channelDest}
            onChange={(e) => setChannelDest(e.target.value)}
            required
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
          />
          {channelType === 'SLACK' && workspaceId && (
            <a
              href={`/integrations/slack/connect?workspaceId=${workspaceId}`}
              className="mb-3 flex items-center gap-2 border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <MessageSquare className="h-4 w-4" />
              Connect Slack
            </a>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </form>
      )}

      {!channels || channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-[var(--border-soft)] py-16">
          <BellRing className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
          <p className="text-lg font-semibold text-[var(--text-main)]">No alert channels</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Configure Slack, email, or webhook channels to route alerts.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-start justify-between gap-4 px-5 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {CHANNEL_ICONS[channel.type] ?? <Globe className="h-4 w-4 text-[var(--text-muted)]" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-main)]">{channel.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{channel.destination}</p>
                </div>
              </div>
                <div className="flex items-center gap-3 text-xs">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      channel.isEnabled ? 'bg-[var(--dot-healthy)]' : 'bg-[var(--dot-down)]'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">
                    {channel.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                <span className="border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-2 py-1 text-[var(--text-muted)]">
                  {channel.type}
                </span>
                <button
                  onClick={() => handleToggleChannel(channel)}
                  className="border border-[var(--border-soft)] px-2 py-1 text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
                >
                  {channel.isEnabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDeleteChannel(channel.id)}
                  className="border border-[var(--border-soft)] px-2 py-1 text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-2 mt-8">
        <p className="text-sm font-semibold text-[var(--text-main)]">Alert Rules</p>
        <p className="text-xs text-[var(--text-muted)]">
          Define when and where alerts are sent.
        </p>
      </div>

      <button
        onClick={() => setShowRuleForm(!showRuleForm)}
        className="mb-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
      >
        {showRuleForm ? null : <Plus className="h-4 w-4" />}
        {showRuleForm ? 'Cancel' : 'Create rule'}
      </button>

      {showRuleForm && (
        <form onSubmit={handleCreateRule} className="mb-4 border border-[var(--border-soft)] p-5">
          <input
            type="text"
            placeholder="Rule name"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            required
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <input
            type="text"
            placeholder="Trigger type (e.g. DOWN, HIGH_LATENCY)"
            value={ruleTrigger}
            onChange={(e) => setRuleTrigger(e.target.value)}
            required
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <select
            value={ruleSeverity}
            onChange={(e) => setRuleSeverity(e.target.value)}
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
          >
            <option value="">Any severity</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <select
            value={ruleChannelId}
            onChange={(e) => setRuleChannelId(e.target.value)}
            required
            className="mb-3 w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
          >
            <option value="">Select a channel</option>
            {channels?.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
          >
            <Plus className="h-4 w-4" />
            Create rule
          </button>
        </form>
      )}

      {!rules || rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-[var(--border-soft)] py-12">
          <AlertTriangle className="mb-4 h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No rules defined yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-start justify-between gap-4 px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-main)]">{rule.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {rule.triggerType}
                  {rule.minimumSeverity ? ` · ${rule.minimumSeverity}+` : ''}
                  {channelById(rule.alertChannelId) ? ` → ${channelById(rule.alertChannelId)?.name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateRule({ id: rule.id, isEnabled: !rule.isEnabled })}
                  className={`h-2 w-2 rounded-full ${
                    rule.isEnabled ? 'bg-[var(--dot-healthy)]' : 'bg-[var(--dot-down)]'
                  }`}
                  title={rule.isEnabled ? 'Disable' : 'Enable'}
                />
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:text-[var(--dot-down)]"
                  title="Delete rule"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete channel confirmation */}
      {deletingChannelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm border border-[var(--border-soft)] bg-[var(--surface-page)]">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">Delete channel</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-[var(--text-muted)]">
                Are you sure you want to delete this alert channel? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingChannelId(null)}
                  className="border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteChannel}
                  className="border border-[var(--dot-down)] px-4 py-2 text-sm text-[var(--dot-down)] hover:bg-[var(--dot-down)]/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
