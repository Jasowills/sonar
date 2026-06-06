import { useState, type FormEvent } from 'react'
import { Modal, Field } from './modal'
import { useCreateService } from '@/lib/api'
import { parseGraphqlError } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  projectId: string
}

export function CreateServiceModal({ open, onClose, projectId }: Props) {
  const { mutateAsync, isPending, error } = useCreateService()
  const [name, setName] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !projectId) return
    await mutateAsync({ projectId, name: name.trim() })
    setName('')
    onClose()
  }

  if (!projectId) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create service"
      submitLabel="Create"
      submitting={isPending}
      onSubmit={handleSubmit}
    >
      <Field label="Name" errors={parseGraphqlError(error)}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
          placeholder="api-service"
          autoFocus
        />
      </Field>
    </Modal>
  )
}
