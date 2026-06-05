import { useEffect, useRef } from 'react'
import { useErrorGroups } from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'

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
  const { project } = useSelectedProject()
  const { data: errorGroups } = useErrorGroups(project?.slug)
  const linkRef = useRef<HTMLLinkElement | null>(null)

  const hasOpenErrors = (errorGroups ?? []).some((g) => g.status === 'OPEN')
  const status: Status = hasOpenErrors ? 'error' : 'healthy'

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
    console.log(`[Favicon] status=${status} hasOpenErrors=${hasOpenErrors}`)
    link.href = url
  }, [status, hasOpenErrors])

  return null
}
