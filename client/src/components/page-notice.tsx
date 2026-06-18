import { AlertTriangle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

type PageNoticeProps = {
  variant: 'loading' | 'error' | 'empty'
  message: string
  onRetry?: () => void
}

export function PageNotice({ variant, message, onRetry }: PageNoticeProps) {
  const isError = variant === 'error'

  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-[var(--border-soft)] px-6 py-16 text-center">
      {variant === 'loading' ? (
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-strong)]" />
      ) : (
        <span
          className={
            isError
              ? 'flex h-10 w-10 items-center justify-center bg-[var(--danger-soft)]'
              : 'flex h-10 w-10 items-center justify-center bg-[var(--surface-panel-soft)]'
          }
        >
          <AlertTriangle className="h-5 w-5 text-[var(--text-main)]" />
        </span>
      )}
      <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">{message}</p>
      {isError && onRetry ? (
        <Button variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
