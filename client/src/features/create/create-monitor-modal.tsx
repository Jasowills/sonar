import { useEffect, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Modal, Field } from './modal'
import {
  useCreateMonitor,
  useUpdateMonitor,
  useEnvironments,
  useServices,
} from '@/lib/api'
import type { Monitor } from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { parseGraphqlError } from '@/lib/utils'
import { CreateServiceModal } from './create-service-modal'
import { CreateEnvironmentModal } from './create-environment-modal'

type Props = {
  open: boolean
  onClose: () => void
  monitor?: Monitor
}

export function CreateMonitorModal({ open, onClose, monitor }: Props) {
  const { project } = useSelectedProject()
  const projectSlug = project?.slug
  const { data: services } = useServices(projectSlug)
  const { data: environments } = useEnvironments(projectSlug)
  const createMutation = useCreateMonitor()
  const updateMutation = useUpdateMonitor()
  const isEditing = !!monitor

  const [name, setName] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [serviceId, setServiceId] = useState('')
  const [environmentId, setEnvironmentId] = useState('')
  const [intervalSeconds, setIntervalSeconds] = useState(30)

  const [showCreateService, setShowCreateService] = useState(false)
  const [showCreateEnvironment, setShowCreateEnvironment] = useState(false)

  useEffect(() => {
    if (monitor) {
      setName(monitor.name)
      setTargetUrl(monitor.targetUrl)
      setMethod(monitor.method)
      setServiceId(monitor.serviceId)
      setEnvironmentId(monitor.environmentId)
      setIntervalSeconds(monitor.intervalSeconds)
    } else {
      setName('')
      setTargetUrl('')
      setMethod('GET')
      setServiceId('')
      setEnvironmentId('')
      setIntervalSeconds(30)
    }
  }, [monitor, open])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !targetUrl.trim() || !serviceId || !environmentId) return

    const input = {
      name: name.trim(),
      targetUrl: targetUrl.trim().match(/^https?:\/\//)
        ? targetUrl.trim()
        : `http://${targetUrl.trim()}`,
      method,
      serviceId,
      environmentId,
      intervalSeconds,
    }

    if (isEditing && monitor) {
      await updateMutation.mutateAsync({ id: monitor.id, ...input })
    } else {
      await createMutation.mutateAsync(input)
    }
    onClose()
  }

  const submitting = createMutation.isPending || updateMutation.isPending
  const errorMessages = parseGraphqlError(createMutation.error ?? updateMutation.error)

  if (!open) return null

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEditing ? 'Edit monitor' : 'Create monitor'}
        submitLabel={isEditing ? 'Save' : 'Create'}
        submitting={submitting}
        onSubmit={handleSubmit}
      >
        <Field label="Name" errors={errorMessages}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
            placeholder="Checkout health check"
            autoFocus
          />
        </Field>
        <Field label="Target URL">
          <input
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
            placeholder="https://api.example.com/health"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Method">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </Field>
          <Field label="Interval (sec)">
            <select
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
            >
              <option value={10}>10 sec</option>
              <option value={30}>30 sec</option>
              <option value={60}>60 sec</option>
              <option value={300}>5 min</option>
            </select>
          </Field>
        </div>

        <Field label="Service">
          <div className="flex gap-2">
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="flex-1 border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
            >
              <option value="">
                {services && services.length > 0
                  ? 'Select service'
                  : 'No services — create one'}
              </option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCreateService(true)}
              className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </Field>

        <Field label="Environment">
          <div className="flex gap-2">
            <select
              value={environmentId}
              onChange={(e) => setEnvironmentId(e.target.value)}
              className="flex-1 border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
            >
              <option value="">
                {environments && environments.length > 0
                  ? 'Select environment'
                  : 'No environments — create one'}
              </option>
              {environments?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCreateEnvironment(true)}
              className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </Field>
      </Modal>

      {project?.id && (
        <CreateServiceModal
          open={showCreateService}
          onClose={() => setShowCreateService(false)}
          projectId={project.id}
        />
      )}
      {project?.id && (
        <CreateEnvironmentModal
          open={showCreateEnvironment}
          onClose={() => setShowCreateEnvironment(false)}
          projectId={project.id}
        />
      )}
    </>
  )
}
