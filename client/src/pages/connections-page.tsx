import { useState } from 'react'
import { AlertTriangle, Cable, Copy, ExternalLink, Monitor, Package, Terminal } from 'lucide-react'
import { useServices, useMonitors, useErrorGroups, useDeployments, useEnvironments } from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'

type ConnectionStatus = 'active' | 'degraded' | 'inactive'

function StatusDot({ status }: { status: ConnectionStatus }) {
  const colors: Record<ConnectionStatus, string> = {
    active: 'bg-[var(--dot-healthy)]',
    degraded: 'bg-[var(--dot-degraded)]',
    inactive: 'bg-[var(--dot-down)]',
  }
  return <span className={`block h-2 w-2 rounded-full ${colors[status]}`} />
}

function ConnectionCard({
  name,
  status,
  children,
}: {
  name: string
  status: ConnectionStatus
  children: React.ReactNode
}) {
  return (
    <div className="border border-[var(--border-soft)]">
      <div className="flex items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4">
        <StatusDot status={status} />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-main)]">{name}</p>
        </div>
      </div>
      <div className="divide-y divide-[var(--border-soft)]">{children}</div>
    </div>
  )
}

function ConnectionRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Terminal
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      </div>
      <span className="text-xs font-medium text-[var(--text-main)]">{value}</span>
    </div>
  )
}

export function ConnectionsPage() {
  const { project } = useSelectedProject()
  const projectSlug = project?.slug
  const { data: services, isLoading: servicesLoading } = useServices(projectSlug)
  const { data: monitors } = useMonitors(projectSlug)
  const { data: errorGroups } = useErrorGroups(projectSlug)
  const { data: deployments } = useDeployments()
  const { data: environments } = useEnvironments(projectSlug)

  const [search, setSearch] = useState('')
  const [copiedNpm, setCopiedNpm] = useState(false)
  const [copiedInit, setCopiedInit] = useState(false)
  const [copiedEnvKey, setCopiedEnvKey] = useState<string | null>(null)

  const handleCopy = (text: string, setter: (v: boolean) => void) => {
    void navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const envKey = environments?.[0]?.key ?? 'production'

  if (servicesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[var(--text-muted)]">Loading connections…</p>
      </div>
    )
  }

  if (!services || services.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        {/* SDK Quickstart */}
        <section className="border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-[var(--text-main)]" />
            <p className="text-sm font-semibold text-[var(--text-main)]">Connect your first service</p>
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            Install the Watchdog SDK and start sending errors and deployment events.
          </p>

          <div className="mt-6 space-y-4">
            {/* Step 1: Install */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">1. Install the package</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-xs font-mono text-[var(--text-main)]">
                  npm install @watchdog/sdk
                </code>
                <button
                  onClick={() => handleCopy('npm install @watchdog/sdk', setCopiedNpm)}
                  className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                >
                  <Copy className="h-3 w-3" />
                  {copiedNpm ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step 2: Init */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">2. Initialize with your project key</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-xs font-mono text-[var(--text-main)] whitespace-pre">
                  {`import { Watchdog } from '@watchdog/sdk'

const watchdog = new Watchdog({
  projectKey: '${projectSlug ?? 'your-project-slug'}',
  environment: '${envKey}',
})`}
                </code>
                <button
                  onClick={() => {
                    const snippet = `import { Watchdog } from '@watchdog/sdk'\n\nconst watchdog = new Watchdog({\n  projectKey: '${projectSlug ?? 'your-project-slug'}',\n  environment: '${envKey}',\n})`
                    handleCopy(snippet, setCopiedInit)
                  }}
                  className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                >
                  <Copy className="h-3 w-3" />
                  {copiedInit ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step 3: Capture */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">3. Capture errors</p>
              <code className="block border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-xs font-mono text-[var(--text-main)]">
                watchdog.captureError(error)
              </code>
            </div>
          </div>

          <div className="mt-6">
            <a
              href="/docs"
              className="inline-flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <ExternalLink className="h-3 w-3" />
              View full SDK documentation
            </a>
          </div>
        </section>

        {/* Environment keys */}
        {environments && environments.length > 0 && (
          <section className="border border-[var(--border-soft)] p-6">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-[var(--text-muted)]" />
              <p className="text-sm font-semibold text-[var(--text-main)]">Environment keys</p>
            </div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Use these environment keys when initializing the SDK.
            </p>
            <div className="mt-4 divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
              {environments.map((env) => (
                <div key={env.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: env.color ?? 'var(--text-muted)' }}
                    />
                    <span className="text-sm font-medium text-[var(--text-main)]">{env.name}</span>
                    <code className="text-xs font-mono text-[var(--text-soft)]">{env.key}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(env.key, (v) => { setCopiedEnvKey(v ? env.key : null) })}
                    className="flex items-center gap-1 border border-[var(--border-soft)] px-2 py-1 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                  >
                    <Copy className="h-2.5 w-2.5" />
                    {copiedEnvKey === env.key ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col items-center justify-center py-8">
          <Cable className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
          <p className="text-lg font-semibold text-[var(--text-main)]">No connections yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Use the SDK above to connect your services. They will appear here.
          </p>
        </div>
      </div>
    )
  }

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const monitorCountForService = (id: string) =>
    monitors?.filter((m) => m.serviceName === services.find((s) => s.id === id)?.name).length ?? 0

  const errorCountForService = (id: string) =>
    errorGroups?.filter((g) => g.serviceId === id).length ?? 0

  const deployCountForService = (id: string) =>
    deployments?.filter((d) => d.serviceName === services.find((s) => s.id === id)?.name).length ?? 0

  const envNames =
    environments?.map((e) => e.name).join(', ') ?? '—'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services…"
          className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 pl-9 text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--border-strong)]"
        />
        <Terminal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">
          No services match &ldquo;{search}&rdquo;.
        </p>
      )}

      <div className="space-y-4">
        {filtered.map((service) => {
          const monitorCount = monitorCountForService(service.id)
          const errorCount = errorCountForService(service.id)
          const deployCount = deployCountForService(service.id)

          let status: ConnectionStatus = 'inactive'
          if (monitorCount > 0 || errorCount > 0 || deployCount > 0) {
            status = 'active'
          }
          if (monitorCount === 0 && errorCount === 0 && deployCount > 0) {
            status = 'degraded'
          }

          return (
            <ConnectionCard key={service.id} name={service.name} status={status}>
              <ConnectionRow
                label="Environments"
                value={envNames}
                icon={Terminal}
              />
              <ConnectionRow
                label="Monitors"
                value={String(monitorCount)}
                icon={Monitor}
              />
              <ConnectionRow
                label="Error groups"
                value={String(errorCount)}
                icon={AlertTriangle}
              />
              <ConnectionRow
                label="Deployments"
                value={String(deployCount)}
                icon={Package}
              />
              {service.description && (
                <ConnectionRow
                  label="Description"
                  value={service.description}
                  icon={ExternalLink}
                />
              )}
            </ConnectionCard>
          )
        })}
      </div>
    </div>
  )
}
