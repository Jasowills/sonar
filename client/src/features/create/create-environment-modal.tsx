import { useState, type FormEvent } from 'react'
import { Modal, Field } from './modal'
import { useCreateEnvironment } from '@/lib/api'
import { parseGraphqlError } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  projectId: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CreateEnvironmentModal({ open, onClose, projectId }: Props) {
  const { mutateAsync, isPending, error } = useCreateEnvironment()
  const [name, setName] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !projectId) return
    const key = slugify(name.trim())
    await mutateAsync({ projectId, name: name.trim(), key })
    setName('')
    onClose()
  }

  if (!projectId) return null

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
      {name && (
        <p className="text-xs text-[var(--text-soft)]">
          Key: <code className="text-[var(--text-muted)]">{slugify(name)}</code>
        </p>
      )}
    </Modal>
  )
}
