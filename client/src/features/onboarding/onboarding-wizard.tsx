import React, { useState } from 'react'
import { Cable, CheckCircle2, Code2, Rocket, Server, Webhook } from 'lucide-react'
import { useEnvironments, useProjects, useRecordDeployment, useServices, useWorkspaces } from '@/lib/api'
import { CreateProjectModal } from '@/features/create/create-project-modal'
import { CreateEnvironmentModal } from '@/features/create/create-environment-modal'
import { CreateServiceModal } from '@/features/create/create-service-modal'
import { CreateMonitorModal } from '@/features/create/create-monitor-modal'
import { ConnectSnippet } from './steps/connect-snippet'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { Rocket, Server, Webhook, Cable, Code2 }

export function OnboardingWizard() {
  const { data: workspaces } = useWorkspaces()
  const { data: projects } = useProjects()
  const project = projects?.[0]
  const { data: environments } = useEnvironments(project?.slug)
  const { data: services } = useServices(project?.slug)
  const { mutateAsync: recordDeploy, isPending: deploying } = useRecordDeployment()

  const workspaceId = workspaces?.[0]?.id
  const hasProject = (projects?.length ?? 0) > 0
  const hasEnvironment = (environments?.length ?? 0) > 0
  const hasService = (services?.length ?? 0) > 0
  const hasDeploys = false

  if (!workspaceId) return <div className="text-xs text-[var(--text-muted)]">Loading workspace&hellip;</div>

  const [step, setStep] = useState(0)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateEnvironment, setShowCreateEnvironment] = useState(false)
  const [showCreateService, setShowCreateService] = useState(false)
  const [showCreateMonitor, setShowCreateMonitor] = useState(false)

  const steps = [
    {
      label: 'Create project & environment',
      done: hasProject && hasEnvironment,
      icon: 'Rocket',
      render: () => (
        <div>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Projects group your services, monitors, and traces. Environments let you separate
            production from staging.
          </p>
          {!hasProject && (
            <button
              onClick={() => setShowCreateProject(true)}
              className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Rocket className="h-3.5 w-3.5" />
              Create project
            </button>
          )}
          {hasProject && !hasEnvironment && (
            <button
              onClick={() => setShowCreateEnvironment(true)}
              className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Rocket className="h-3.5 w-3.5" />
              Create environment
            </button>
          )}
        </div>
      ),
    },
    {
      label: 'Create a service',
      done: hasService,
      icon: 'Server',
      render: () => (
        <div>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Services group your monitors and traces into logical surfaces like &ldquo;api&rdquo; or &ldquo;web&rdquo;.
          </p>
          {hasProject && hasEnvironment && !hasService && (
            <button
              onClick={() => setShowCreateService(true)}
              className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Server className="h-3.5 w-3.5" />
              Create service
            </button>
          )}
        </div>
      ),
    },
    {
      label: 'Create an HTTP monitor',
      done: false,
      icon: 'Webhook',
      render: () => (
        <div>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Watchdog pings your endpoints and reports uptime, latency, and status changes.
          </p>
          {hasProject && hasEnvironment && hasService && (
            <button
              onClick={() => setShowCreateMonitor(true)}
              className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Webhook className="h-3.5 w-3.5" />
              Create monitor
            </button>
          )}
        </div>
      ),
    },
    {
      label: 'Connect your app',
      done: false,
      icon: 'Cable',
      render: () => (
        <div>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Install the SDK, capture errors, and track deploys with framework-specific setup.
          </p>
          <ConnectSnippet projectKey={project?.slug ?? ''} envKey={environments?.[0]?.key ?? ''} />
        </div>
      ),
    },
    {
      label: 'Record a test deployment',
      done: hasDeploys,
      icon: 'Code2',
      render: () => (
        <div>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            POST a deployment event to track releases alongside your monitors and traces.
          </p>
          <button
            onClick={async () => {
              const env = environments?.[0]
              if (!env) return
              await recordDeploy({
                environmentId: env.id,
                version: `manual-${Date.now()}`,
                description: 'Manual deployment from onboarding',
              })
            }}
            disabled={deploying || !environments?.[0]}
            className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-40"
          >
            <Code2 className="h-3.5 w-3.5" />
            {deploying ? 'Recording\u2026' : 'Record a deploy'}
          </button>
        </div>
      ),
    },
  ]

  const StepIcon = iconMap[steps[step].icon]

  return (
    <section className="border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Rocket className="h-5 w-5 text-[var(--text-main)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">Getting started</p>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-muted)]">
        Follow these steps to set up monitoring for your services.
      </p>

      <div className="mt-8 flex items-center gap-2">
        {steps.map((s, i) => {
          const isCurrent = i === step
          const isDone = s.done
          const clickable = isDone || i <= steps.findIndex((st) => !st.done)
          return (
            <button
              key={s.label}
              onClick={() => { if (clickable) setStep(i) }}
              className={`flex h-8 w-8 items-center justify-center border text-xs font-medium transition-colors ${
                isCurrent
                  ? 'border-[var(--text-main)] text-[var(--text-main)]'
                  : isDone
                    ? 'border-[var(--dot-healthy)] text-[var(--dot-healthy)]'
                    : 'border-[var(--border-soft)] text-[var(--text-muted)]'
              }`}
              title={s.label}
            >
              {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </button>
          )
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-[var(--border-soft)]">
            {StepIcon && <StepIcon className="h-4 w-4 text-[var(--text-muted)]" />}
          </div>
          <p className="text-sm font-semibold text-[var(--text-main)]">{steps[step].label}</p>
        </div>
        <div className="mt-4">{steps[step].render()}</div>

        <div className="mt-6 flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="border border-[var(--border-soft)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
            >
              Back
            </button>
          )}
          {steps[step].done && step < steps.length - 1 && (
            <button
              onClick={() => setStep(step + 1)}
              className="border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              Continue
            </button>
          )}
        </div>
      </div>

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
