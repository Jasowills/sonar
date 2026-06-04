import { type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Spinner } from '@/components/spinner'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  onSubmit: (e: FormEvent) => void
  submitLabel: string
  submitting: boolean
  children: ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  onSubmit,
  submitLabel,
  submitting,
  children,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md border border-[var(--border-soft)] bg-[var(--surface-page)]">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-main)]">{title}</p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 px-5 py-5">
          {children}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 bg-[var(--text-main)] px-4 py-2 text-sm text-[var(--surface-page)] hover:opacity-90 disabled:opacity-50"
            >
              {submitting && <Spinner />}
              {submitting ? 'Saving\u2026' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type FieldProps = {
  label: string
  errors?: string[]
  children: ReactNode
}

export function Field({ label, errors, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        {label}
      </label>
      {children}
      {errors && errors.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {errors.map((msg, i) => (
            <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
          ))}
        </div>
      )}
    </div>
  )
}
