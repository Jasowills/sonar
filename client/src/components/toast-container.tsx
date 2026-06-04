import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useToasts, type Toast } from '@/lib/toast-store'
import { useEventSource, type SseNotification, type SseErrorCreated } from '@/lib/event-source'

const SSE_TYPE_TOAST: Record<string, { type: Toast['type']; label: string }> = {
  monitor_down: { type: 'error', label: 'Monitor Down' },
  monitor_up: { type: 'success', label: 'Monitor Recovered' },
  monitor_degraded: { type: 'warning', label: 'Monitor Degraded' },
  incident_created: { type: 'error', label: 'Incident Created' },
  incident_resolved: { type: 'success', label: 'Incident Resolved' },
  deploy_completed: { type: 'success', label: 'Deploy Completed' },
  alert_fired: { type: 'warning', label: 'Alert Fired' },
  error_created: { type: 'error', label: 'New Error' },
}

function isSseNotification(data: unknown): data is SseNotification {
  return typeof data === 'object' && data !== null && 'id' in data && 'type' in data
}

function notificationToast(n: SseNotification): Omit<Toast, 'id'> | null {
  const mapping = SSE_TYPE_TOAST[n.type]
  if (!mapping) return null
  return {
    type: mapping.type,
    title: mapping.label,
    body: n.title,
    duration: 6000,
  }
}

function errorCreatedToast(n: SseErrorCreated): Omit<Toast, 'id'> {
  return {
    type: 'error',
    title: 'New Error',
    body: n.title,
    duration: 8000,
  }
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const TYPE_STYLES: Record<string, string> = {
    info: 'border-l-[var(--text-muted)]',
    success: 'border-l-[var(--dot-healthy)]',
    warning: 'border-l-[var(--dot-degraded)]',
    error: 'border-l-[var(--dot-down)]',
  }

  return (
    <div
      className={`flex items-start gap-3 border-l-4 bg-[var(--surface-page)] px-4 py-3 text-sm shadow-lg ${TYPE_STYLES[toast.type] ?? TYPE_STYLES.info}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[var(--text-main)]">{toast.title}</p>
        {toast.body && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{toast.body}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="mt-0.5 text-[var(--text-soft)] hover:text-[var(--text-main)]"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast, addToast } = useToasts()
  const { lastEvent } = useEventSource()

  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'notification' && isSseNotification(lastEvent.data)) {
      const t = notificationToast(lastEvent.data)
      if (t) addToast(t)
    }
    if (lastEvent.type === 'error_created') {
      const t = errorCreatedToast(lastEvent.data as SseErrorCreated)
      if (t) addToast(t)
    }
  }, [lastEvent, addToast])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-80">
          <ToastItem toast={t} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  )
}
