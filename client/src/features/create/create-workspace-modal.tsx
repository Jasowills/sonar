import { useState, type FormEvent } from 'react'
import { Modal, Field } from './modal'
import { useCreateWorkspace } from '@/lib/api'
import { parseGraphqlError } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
}

export function CreateWorkspaceModal({ open, onClose }: Props) {
  const { mutateAsync, isPending, error } = useCreateWorkspace()
  const [name, setName] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await mutateAsync({ name: name.trim() })
    setName('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create workspace"
      submitLabel="Create"
      submitting={isPending}
      onSubmit={handleSubmit}
    >
      <Field label="Name" errors={parseGraphqlError(error)}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
          placeholder="My workspace"
          autoFocus
        />
      </Field>
    </Modal>
  )
}
