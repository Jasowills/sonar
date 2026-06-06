import { useEffect, useState } from 'react'
import { Cable, CheckCircle2, Code2, Globe, Rocket, Server, Webhook } from 'lucide-react'

import { useEnvironments, useMonitors, useProjects, useRecordDeployment, useServices, useWorkspaces } from '@/lib/api'
import { CreateProjectModal } from '@/features/create/create-project-modal'
import { CreateEnvironmentModal } from '@/features/create/create-environment-modal'
import { CreateServiceModal } from '@/features/create/create-service-modal'
import { CreateMonitorModal } from '@/features/create/create-monitor-modal'
import { ConnectSnippet } from './steps/connect-snippet'

type Props = {
  onSkip: () => void
}

const STEPS = [
  { label: 'Name your project', icon: Rocket },
  { label: 'Set up an environment', icon: Globe },
  { label: 'Add a service', icon: Server },
  { label: 'Add a monitor', icon: Webhook },
  { label: 'Connect your app', icon: Cable },
  { label: 'Record a deployment', icon: Code2 },
] as const

export function OnboardingWizard({ onSkip }: Props) {
  const { data: workspaces } = useWorkspaces()
  const { data: projects } = useProjects()
  const project = projects?.[0]
  const { data: environments } = useEnvironments(project?.slug)
  const { data: services } = useServices(project?.slug)
  const { data: monitors } = useMonitors(project?.slug)
  const { mutateAsync: recordDeploy, isPending: deploying } = useRecordDeployment()

  const workspaceId = workspaces?.[0]?.id
  const hasProject = (projects?.length ?? 0) > 0
  const hasEnvironment = (environments?.length ?? 0) > 0
  const hasService = (services?.length ?? 0) > 0
  const hasMonitor = (monitors?.length ?? 0) > 0
  const [hasDeploy, setHasDeploy] = useState(false)

  const stepDone = [
    hasProject,
    hasEnvironment,
    hasService,
    hasMonitor,
    false,
    hasDeploy,
  ]

  const [step, setStep] = useState(0)
  const [showModal, setShowModal] = useState<'project' | 'environment' | 'service' | 'monitor' | null>(null)
  const currentStepDone = stepDone[step]

  useEffect(() => {
    if (currentStepDone && step < STEPS.length - 1) {
      setStep(step + 1)
    }
  }, [currentStepDone, step])

  if (!workspaceId) return <div className="text-xs text-[var(--text-muted)]">Loading workspace&hellip;</div>

  const current = STEPS[step]
  const totalSteps = STEPS.length

  return (
    <section className="border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rocket className="h-5 w-5 text-[var(--text-main)]" />
          <p className="text-sm font-semibold text-[var(--text-main)]">Welcome to Sonar</p>
        </div>
        <button onClick={onSkip} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]">
          Skip guide →
        </button>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-muted)]">
        Let&rsquo;s set up your first project. You can configure everything in more detail later.
      </p>

      {/* Progress indicator */}
      <div className="mt-8 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = stepDone[i]
          const active = i === step
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className={`flex h-8 w-8 items-center justify-center border text-xs font-medium transition-colors ${
                active ? 'border-[var(--text-main)] text-[var(--text-main)]' : done ? 'border-[var(--dot-healthy)] text-[var(--dot-healthy)]' : 'border-[var(--border-soft)] text-[var(--text-muted)]'
              }`}
              title={s.label}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-[var(--border-soft)]">
            <current.icon className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-main)]">
            Step {step + 1} of {totalSteps}: {current.label}
          </p>
        </div>

        <div className="mt-4">
          {step === 0 && (
            <div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Give your project a name. You can change it later.
              </p>
              {!hasProject && (
                <button onClick={() => setShowModal('project')} className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]">
                  <Rocket className="h-3.5 w-3.5" />
                  Name your project
                </button>
              )}
              {hasProject && (
                <p className="mt-4 text-xs text-[var(--dot-healthy)]">Project created.</p>
              )}
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Environments separate production from staging or development.
              </p>
              {!hasEnvironment ? (
                <button onClick={() => setShowModal('environment')} className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]">
                  <Globe className="h-3.5 w-3.5" />
                  Create environment
                </button>
              ) : (
                <p className="mt-4 text-xs text-[var(--dot-healthy)]">Environment created.</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Services group your monitors and traces by surface, like &ldquo;API&rdquo; or &ldquo;Web&rdquo;.
              </p>
              {!hasService ? (
                <button onClick={() => setShowModal('service')} className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]">
                  <Server className="h-3.5 w-3.5" />
                  Add a service
                </button>
              ) : (
                <p className="mt-4 text-xs text-[var(--dot-healthy)]">Service added.</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Monitors check your endpoints and report uptime, latency, and status changes.
              </p>
              {!hasMonitor ? (
                <button onClick={() => setShowModal('monitor')} className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]">
                  <Webhook className="h-3.5 w-3.5" />
                  Add a monitor
                </button>
              ) : (
                <p className="mt-4 text-xs text-[var(--dot-healthy)]">Monitor added.</p>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Install the Sonar SDK to capture errors and track deploys from your codebase.
              </p>
              <ConnectSnippet envKey={environments?.[0]?.key ?? ''} />
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Record your first deployment to correlate releases with monitors and traces.
              </p>
              {!hasDeploy ? (
                <button
                  onClick={async () => {
                    const env = environments?.[0]
                    if (!env) return
                    await recordDeploy({
                      environmentId: env.id,
                      version: `manual-${Date.now()}`,
                      description: 'Manual deployment from onboarding',
                    })
                    setHasDeploy(true)
                  }}
                  disabled={deploying || !environments?.[0]}
                  className="mt-4 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-40"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {deploying ? 'Recording\u2026' : 'Record a deploy'}
                </button>
              ) : (
                <p className="mt-4 text-xs text-[var(--dot-healthy)]">Deploy recorded. You&rsquo;re all set!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal === 'project' && workspaceId && (
        <CreateProjectModal open onClose={() => setShowModal(null)} workspaceId={workspaceId} />
      )}
      {showModal === 'environment' && project?.id && (
        <CreateEnvironmentModal open onClose={() => setShowModal(null)} projectId={project.id} />
      )}
      {showModal === 'service' && project?.id && (
        <CreateServiceModal open onClose={() => setShowModal(null)} projectId={project.id} />
      )}
      {showModal === 'monitor' && project?.slug && (
        <CreateMonitorModal open onClose={() => setShowModal(null)} />
      )}
    </section>
  )
}
