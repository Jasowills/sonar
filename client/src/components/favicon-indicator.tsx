import { useEffect, useRef, useState } from 'react'
import { useEventSource } from '@/lib/event-source'

type Status = 'healthy' | 'warning' | 'error'

const DOT_COLORS: Record<Status, string> = {
  healthy: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
}

function svgDataUrl(status: Status): string {
  const dot = DOT_COLORS[status]
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" fill="#0a0a0a" rx="3"/>
      <polygon points="16,3 26,9 26,21 16,27 6,21 6,9" fill="none" stroke="#d0d0d0" stroke-width="0.8"/>
      <circle cx="16" cy="15" r="6" fill="none" stroke="#d0d0d0" stroke-width="0.8"/>
      <circle cx="16" cy="15" r="2.5" fill="none" stroke="#d0d0d0" stroke-width="0.8"/>
      <circle cx="16" cy="15" r="1" fill="#d0d0d0"/>
      <circle cx="28" cy="28" r="4" fill="${dot}"/>
    </svg>`,
  )}`
}

export function FaviconIndicator() {
  const { lastEvent } = useEventSource()
  const [status, setStatus] = useState<Status>('healthy')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const linkRef = useRef<HTMLLinkElement | null>(null)

  useEffect(() => {
    if (!lastEvent) return

    let next: Status | null = null
    if (lastEvent.type === 'error_created') {
      console.log('[Favicon] error_created → error')
      next = 'error'
    } else if (lastEvent.type === 'notification') {
      const nd = lastEvent.data as { type?: string }
      const t = nd?.type ?? ''
      console.log('[Favicon] notification type=' + t)
      if (t === 'monitor_down' || t === 'incident_created') { console.log('[Favicon] → error'); next = 'error' }
      else if (t === 'monitor_degraded' || t === 'alert_fired') { console.log('[Favicon] → warning'); next = 'warning' }
      else if (t === 'monitor_up' || t === 'incident_resolved') { console.log('[Favicon] → healthy'); next = 'healthy' }
    }

    if (next) {
      setStatus(next)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (next !== 'healthy') {
        timerRef.current = setTimeout(() => { console.log('[Favicon] decay → healthy'); setStatus('healthy') }, 30_000)
      }
    }
  }, [lastEvent])

  useEffect(() => {
    let link = linkRef.current
    if (!link) {
      link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      linkRef.current = link
    }
    const url = svgDataUrl(status)
    console.log(`[Favicon] set href status=${status} url.length=${url.length}`)
    link.href = url
  }, [status])

  return null
}
