import type { MonitorState } from '@/lib/api'

type MonitorStateMeta = {
  label: string
  dotClass: string
}

const META: Record<MonitorState, MonitorStateMeta> = {
  HEALTHY: { label: 'Healthy', dotClass: 'bg-[var(--dot-healthy)]' },
  DEGRADED: { label: 'Degraded', dotClass: 'bg-[var(--dot-degraded)]' },
  DOWN: { label: 'Down', dotClass: 'bg-[var(--dot-down)]' },
  PENDING: { label: 'Pending', dotClass: 'bg-[var(--text-soft)]' },
}

export function monitorStateMeta(state: MonitorState | string): MonitorStateMeta {
  return META[state as MonitorState] ?? { label: state, dotClass: 'bg-[var(--text-soft)]' }
}

export function formatInterval(seconds: number): string {
  if (seconds % 60 === 0) {
    return `${seconds / 60} min`
  }
  return `${seconds} sec`
}

export function formatLatency(latencyMs: number | null): string {
  return latencyMs == null ? '—' : `${latencyMs} ms`
}
