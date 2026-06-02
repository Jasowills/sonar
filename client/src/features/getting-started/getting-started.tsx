import { useState } from 'react'
import { CheckCircle2, Circle, Code2, ExternalLink, Rocket, Server, Webhook } from 'lucide-react'
import { useEnvironments, useProjects, useRecordDeployment, useServices, useWorkspaces } from '@/lib/api'
import { CreateProjectModal } from '@/features/create/create-project-modal'
import { CreateEnvironmentModal } from '@/features/create/create-environment-modal'
import { CreateServiceModal } from '@/features/create/create-service-modal'
import { CreateMonitorModal } from '@/features/create/create-monitor-modal'

type GettingStartedProps = {
  hasMonitors: boolean
  hasDeploys: boolean
}

export function GettingStarted({ hasMonitors, hasDeploys }: GettingStartedProps) {
  const { data: workspaces } = useWorkspaces()
  const { data: projects } = useProjects()
  const project = projects?.[0]
  const { data: environments } = useEnvironments(project?.slug)
  const { data: services } = useServices(project?.slug)
  const { mutateAsync: recordDeploy, isPending: deploying } = useRecordDeployment()

  const workspaceId = workspaces?.[0]?.id ?? ''
  const hasProject = (projects?.length ?? 0) > 0
  const hasEnvironment = (environments?.length ?? 0) > 0
  const hasService = (services?.length ?? 0) > 0

  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateEnvironment, setShowCreateEnvironment] = useState(false)
  const [showCreateService, setShowCreateService] = useState(false)
  const [showCreateMonitor, setShowCreateMonitor] = useState(false)

  const handleRecordDeploy = async () => {
    const env = environments?.[0]
    if (!env) return
    await recordDeploy({
      environmentId: env.id,
      version: `manual-${Date.now()}`,
      description: 'Manual deployment from getting started',
    })
  }

  const steps = [
    {
      label: 'Create your first project & environment',
      description: 'Projects group your services, monitors, and traces into a single surface.',
      done: hasProject && hasEnvironment,
      icon: Rocket,
      actions: !hasProject ? (
        <button
          onClick={() => setShowCreateProject(true)}
          className="mt-2 flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <Rocket className="h-3 w-3" />
          Create project
        </button>
      ) : !hasEnvironment ? (
        <button
          onClick={() => setShowCreateEnvironment(true)}
          className="mt-2 flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <Rocket className="h-3 w-3" />
          Create environment
        </button>
      ) : null,
    },
    {
      label: 'Create a service',
      description: 'Services group your monitors into logical surfaces like "api" or "web".',
      done: hasService,
      icon: Server,
      actions: hasProject && hasEnvironment && !hasService ? (
        <button
          onClick={() => setShowCreateService(true)}
          className="mt-2 flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <Server className="h-3 w-3" />
          Create service
        </button>
      ) : null,
    },
    {
      label: 'Set up an HTTP monitor',
      description: 'Watchdog pings your endpoints and reports uptime, latency, and status changes.',
      done: hasMonitors,
      icon: Webhook,
      actions: hasProject && hasEnvironment && hasService && !hasMonitors ? (
        <button
          onClick={() => setShowCreateMonitor(true)}
          className="mt-2 flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <Webhook className="h-3 w-3" />
          Create monitor
        </button>
      ) : null,
    },
    {
      label: 'Connect your CI pipeline',
      description: 'POST deployment events to track releases alongside your monitors and traces.',
      done: hasDeploys,
      icon: Code2,
      actions: !hasDeploys ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={handleRecordDeploy}
            disabled={deploying || !environments?.[0]}
            className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-40"
          >
            <Code2 className="h-3 w-3" />
            {deploying ? 'Recording…' : 'Record a deploy'}
          </button>
          <a
            href="/docs"
            className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
          >
            <ExternalLink className="h-3 w-3" />
            View docs
          </a>
        </div>
      ) : null,
    },
  ]

  return (
    <section className="border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Rocket className="h-5 w-5 text-[var(--text-main)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">Getting started</p>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-muted)]">
        Follow these steps to set up monitoring for your services.
      </p>

      <ol className="mt-8 space-y-6">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <li key={step.label} className="flex gap-4">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--dot-healthy)]" />
                ) : (
                  <Circle className="h-5 w-5 text-[var(--text-soft)]" />
                )}
              </div>
              <div className="flex min-w-0 gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--surface-page)]">
                  <Icon className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${step.done ? 'text-[var(--text-soft)]' : 'text-[var(--text-main)]'}`}>
                    {step.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{step.description}</p>
                  {!step.done && step.actions}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <CreateProjectModal
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        workspaceId={workspaceId}
      />
      <CreateEnvironmentModal
        open={showCreateEnvironment}
        onClose={() => setShowCreateEnvironment(false)}
        projectId={project?.id ?? ''}
      />
      <CreateServiceModal
        open={showCreateService}
        onClose={() => setShowCreateService(false)}
        projectId={project?.id ?? ''}
      />
      <CreateMonitorModal
        open={showCreateMonitor}
        onClose={() => setShowCreateMonitor(false)}
      />
    </section>
  )
}
