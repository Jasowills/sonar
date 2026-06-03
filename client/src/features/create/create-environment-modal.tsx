import { useState, type FormEvent } from 'react'
import { Modal, Field } from './modal'
import { useCreateEnvironment } from '@/lib/api'
import { parseGraphqlError } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  projectId: string
}

export function CreateEnvironmentModal({ open, onClose, projectId }: Props) {
  const { mutateAsync, isPending, error } = useCreateEnvironment()
  const [name, setName] = useState('')
  const [key, setKey] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await mutateAsync({
      projectId,
      name: name.trim(),
      key: key.trim() || undefined,
    })
    setName('')
    setKey('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create environment"
      submitLabel="Create"
      submitting={isPending}
      onSubmit={handleSubmit}
    >
      <Field label="Name" errors={parseGraphqlError(error)}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
          placeholder="Production"
          autoFocus
        />
      </Field>
      <Field label="Key">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
          placeholder="production"
        />
      </Field>
    </Modal>
  )
}
