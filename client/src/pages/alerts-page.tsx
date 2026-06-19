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
  Loader2,
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
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

const LABEL_CLS = 'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]'
const INPUT_CLS = 'w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]'

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  SLACK: <MessageSquare className="h-4 w-4" />,
  WEBHOOK: <Globe className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
}

function SectionCard({ icon: Icon, title, description, children, action }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--text-muted)]" />
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-main)]">{title}</h2>
            {description && (
              <p className="font-mono text-[10px] text-[var(--text-soft)]">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="flex shrink-0 items-center">{action}</div>}
      </div>
      {children}
    </div>
  )
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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        <p className="mt-4 text-sm text-[var(--text-muted)]">Loading alert configuration…</p>
      </div>
    )
  }

  if (channelsError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-soft)] py-20">
        <AlertTriangle className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">Failed to load alert channels</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
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
      {/* Mutation error banner */}
      {mutationError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-[var(--dot-down)]/20 bg-[var(--surface-danger)]/30 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--dot-down)]" />
          <div className="space-y-0.5">
            {mutationError.map((msg, i) => (
              <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
            ))}
          </div>
        </div>
      )}

      {/* Alert Channels */}
      <SectionCard
        icon={BellRing}
        title="Alert Channels"
        description="Configure how alerts reach your team."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChannelForm(!showChannelForm)}
          >
            {showChannelForm ? null : <Plus className="h-3.5 w-3.5" />}
            {showChannelForm ? 'Cancel' : 'Add channel'}
          </Button>
        }
      >
        {showChannelForm && (
          <form onSubmit={handleCreateChannel} className="border-b border-[var(--border-soft)]">
            <div className="space-y-4 p-5">
              <div>
                <label className={LABEL_CLS}>Channel name</label>
                <input
                  type="text"
                  placeholder="e.g. Production alerts"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  required
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Type</label>
                <Select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value)}
                  options={[
                    { value: 'SLACK', label: 'Slack' },
                    { value: 'WEBHOOK', label: 'Webhook' },
                    { value: 'EMAIL', label: 'Email' },
                  ]}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Destination</label>
                <input
                  type={channelType === 'EMAIL' ? 'email' : 'url'}
                  placeholder={channelType === 'EMAIL' ? 'email@example.com' : 'https://hooks.example.com/…'}
                  value={channelDest}
                  onChange={(e) => setChannelDest(e.target.value)}
                  required
                  className={INPUT_CLS}
                />
              </div>
              {channelType === 'SLACK' && workspaceId && (
                <a
                  href={`/integrations/slack/connect?workspaceId=${workspaceId}`}
                  className="flex items-center gap-2 rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Connect Slack
                </a>
              )}
            </div>
            <div className="flex items-center justify-end border-t border-[var(--border-soft)] px-5 py-3">
              <Button type="submit" variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Create
              </Button>
            </div>
          </form>
        )}

        {!channels || channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <BellRing className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-main)]">No alert channels</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Configure Slack, email, or webhook channels to route alerts.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 text-[var(--text-muted)]">
                    {CHANNEL_ICONS[channel.type] ?? <Globe className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-main)]">{channel.name}</p>
                    <p className="truncate font-mono text-[10px] text-[var(--text-soft)]">{channel.destination}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${channel.isEnabled ? 'bg-[var(--dot-healthy)]' : 'bg-[var(--dot-down)]'}`} />
                  <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    {channel.type}
                  </span>
                  <button
                    onClick={() => handleToggleChannel(channel)}
                    className="rounded-md border border-[var(--border-soft)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] transition-colors"
                  >
                    {channel.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteChannel(channel.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-danger)] hover:text-[var(--dot-down)]"
                    title="Delete channel"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Alert Rules */}
      <SectionCard
        icon={AlertTriangle}
        title="Alert Rules"
        description="Define when and where alerts are sent."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRuleForm(!showRuleForm)}
          >
            {showRuleForm ? null : <Plus className="h-3.5 w-3.5" />}
            {showRuleForm ? 'Cancel' : 'Create rule'}
          </Button>
        }
      >
        {showRuleForm && (
          <form onSubmit={handleCreateRule} className="border-b border-[var(--border-soft)]">
            <div className="space-y-4 p-5">
              <div>
                <label className={LABEL_CLS}>Rule name</label>
                <input
                  type="text"
                  placeholder="e.g. Notify on critical failures"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  required
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Trigger type</label>
                <input
                  type="text"
                  placeholder="e.g. DOWN, HIGH_LATENCY"
                  value={ruleTrigger}
                  onChange={(e) => setRuleTrigger(e.target.value)}
                  required
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Minimum severity</label>
                <Select
                  value={ruleSeverity}
                  onChange={(e) => setRuleSeverity(e.target.value)}
                  options={[
                    { value: '', label: 'Any severity' },
                    { value: 'CRITICAL', label: 'CRITICAL' },
                    { value: 'HIGH', label: 'HIGH' },
                    { value: 'MEDIUM', label: 'MEDIUM' },
                    { value: 'LOW', label: 'LOW' },
                  ]}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Channel</label>
                <Select
                  value={ruleChannelId}
                  onChange={(e) => setRuleChannelId(e.target.value)}
                  placeholder="Select a channel"
                  options={(channels ?? []).map((ch) => ({ value: ch.id, label: ch.name }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-end border-t border-[var(--border-soft)] px-5 py-3">
              <Button type="submit" variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Create rule
              </Button>
            </div>
          </form>
        )}

        {!rules || rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="mb-2 h-6 w-6 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)]">No rules defined yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-main)]">{rule.name}</p>
                  <p className="font-mono text-[10px] text-[var(--text-soft)]">
                    {rule.triggerType}
                    {rule.minimumSeverity ? ` · ${rule.minimumSeverity}+` : ''}
                    {channelById(rule.alertChannelId) ? ` → ${channelById(rule.alertChannelId)?.name}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => updateRule({ id: rule.id, isEnabled: !rule.isEnabled })}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      rule.isEnabled ? 'bg-[var(--dot-healthy)]' : 'bg-[var(--dot-down)]'
                    }`}
                    title={rule.isEnabled ? 'Disable' : 'Enable'}
                  />
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-danger)] hover:text-[var(--dot-down)]"
                    title="Delete rule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Delete confirmation modal */}
      {deletingChannelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)] shadow-lg">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">Delete channel</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-[var(--text-muted)]">
                Are you sure you want to delete this alert channel? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeletingChannelId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={confirmDeleteChannel}
                  className="border-[var(--dot-down)]/40 text-[var(--dot-down)] hover:bg-[var(--surface-danger)]"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
