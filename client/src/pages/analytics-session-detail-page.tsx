import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAnalyticsSession, useAnalyticsSessionEvents } from '@/lib/api'
import type { AnalyticsEvent } from '@/lib/api'
import { PageNotice } from '@/components/page-notice'
import {
  Activity,
  MousePointerClick,
  ScrollText,
  FileText,
  AlertCircle,
  FormInput,
  Target,
  Camera,
  AlertTriangle,
  Flame,
  HelpCircle,
  Watch,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  page_view: FileText,
  click: MousePointerClick,
  scroll: ScrollText,
  form_submit: FormInput,
  console_error: AlertCircle,
  screenshot: Camera,
  recording_mouse: Target,
  recording_click: MousePointerClick,
  recording_scroll: ScrollText,
  frustration_rage_click: Flame,
  frustration_dead_click: AlertTriangle,
  frustration_hesitation: Watch,
  frustration_scroll_chaos: AlertTriangle,
  frustration_cascade: Flame,
}

function severityColor(severity: number | null): string {
  if (severity === null || severity === 0) return 'text-[var(--text-muted)]'
  if (severity >= 0.8) return 'text-red-500'
  if (severity >= 0.5) return 'text-amber-500'
  return 'text-[var(--text-soft)]'
}

function severityBg(severity: number | null): string {
  if (severity === null || severity === 0) return ''
  if (severity >= 0.8) return 'border-red-500/30 bg-red-500/5'
  if (severity >= 0.5) return 'border-amber-500/30 bg-amber-500/5'
  return ''
}

export function AnalyticsSessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session, isLoading: loadingSession, isError: sessionError } = useAnalyticsSession(id)
  const { data: events, isLoading: loadingEvents } = useAnalyticsSessionEvents(id)
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null)

  if (loadingSession || loadingEvents) {
    return <PageNotice variant="loading" message="Loading session…" />
  }

  if (sessionError || !session) {
    return <PageNotice variant="error" message="Session not found." />
  }

  return (
    <div className="space-y-6">
      {/* Session header */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Visitor</p>
          <p className="mt-1 font-mono text-sm text-[var(--text-main)]">
            {session.visitorId ? session.visitorId.slice(0, 16) + '…' : '-'}
          </p>
        </div>
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Duration</p>
          <p className="mt-1 text-sm text-[var(--text-main)]">
            {session.duration ? formatDuration(session.duration) : '-'}
          </p>
        </div>
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Device</p>
          <p className="mt-1 text-sm text-[var(--text-main)]">
            {[session.browser, session.os, session.device].filter(Boolean).join(' · ') || '-'}
          </p>
        </div>
        <div className="border border-[var(--border-soft)] px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Page views</p>
          <p className="mt-1 text-sm text-[var(--text-main)]">{session.pageViews}</p>
        </div>
      </div>

      {/* Frustration score card */}
      {(session.frustrationScore != null || session.hasFrustrationSignals) && (
        <div className="flex flex-wrap gap-4">
          {session.frustrationScore != null && (
            <div className={`border px-5 py-4 ${session.frustrationScore >= 50 ? 'border-red-500/30 bg-red-500/5' : session.frustrationScore >= 20 ? 'border-amber-500/30 bg-amber-500/5' : 'border-[var(--border-soft)]'}`}>
              <p className="text-xs font-medium text-[var(--text-muted)]">Frustration score</p>
              <p className={`mt-1 text-2xl font-bold ${session.frustrationScore >= 50 ? 'text-red-500' : session.frustrationScore >= 20 ? 'text-amber-500' : 'text-[var(--text-main)]'}`}>
                {session.frustrationScore}/100
              </p>
            </div>
          )}
          {session.userIntent && (
            <div className="border border-[var(--border-soft)] px-5 py-4">
              <p className="text-xs font-medium text-[var(--text-muted)]">Intent</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-main)]">{session.userIntent}</p>
            </div>
          )}
          {session.totalRageClicks > 0 && (
            <div className="border border-[var(--border-soft)] px-5 py-4">
              <p className="text-xs font-medium text-[var(--text-muted)]">Rage clicks</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-main)]">{session.totalRageClicks}</p>
            </div>
          )}
          {session.totalDeadClicks > 0 && (
            <div className="border border-[var(--border-soft)] px-5 py-4">
              <p className="text-xs font-medium text-[var(--text-muted)]">Dead clicks</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-main)]">{session.totalDeadClicks}</p>
            </div>
          )}
          {session.totalErrors > 0 && (
            <div className="border border-[var(--border-soft)] px-5 py-4">
              <p className="text-xs font-medium text-[var(--text-muted)]">Errors</p>
              <p className="mt-1 text-lg font-bold text-red-500">{session.totalErrors}</p>
            </div>
          )}
        </div>
      )}

      {/* Session video */}
      {session.videoUrl && (
        <div className="border border-[var(--border-soft)]">
          <div className="border-b border-[var(--border-soft)] px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
              <Activity className="h-4 w-4 text-[var(--text-muted)]" />
              Session recording
            </h3>
          </div>
          <div className="px-5 py-4">
            <video
              src={session.videoUrl}
              controls
              className="w-full max-h-[480px] rounded border border-[var(--border-soft)] bg-black"
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
          </div>
        </div>
      )}

      {/* Event timeline */}
      <div className="border border-[var(--border-soft)]">
        <div className="border-b border-[var(--border-soft)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">Event timeline</h3>
        </div>
        {events && events.length > 0 ? (
          <div className="divide-y divide-[var(--border-soft)]">
            {events.map((event) => {
              const EventIcon = typeIcons[event.type] ?? Activity
              const payload = parsePayload(event.payload)

              return (
                <div
                  key={event.id}
                  className={`px-5 py-4 ${event.severity && event.severity >= 0.5 ? severityBg(event.severity) : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border ${event.severity && event.severity >= 0.5 ? 'border-amber-500/30 bg-amber-500/10' : 'border-[var(--border-soft)] bg-[var(--surface-panel)]'}`}>
                      <EventIcon className={`h-3.5 w-3.5 ${severityColor(event.severity)}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-main)]">
                          {formatEventType(event.type)}
                        </span>
                        {event.severity != null && event.severity > 0 && (
                          <span className={`text-[10px] font-semibold uppercase ${severityColor(event.severity)}`}>
                            {(event.severity * 100).toFixed(0)}%
                          </span>
                        )}
                        {event.name && (
                          <span className="max-w-[300px] truncate text-xs text-[var(--text-muted)]">
                            {event.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {event.url}
                      </p>
                      {event.fingerprint && (
                        <p className="mt-0.5 text-[10px] font-mono text-[var(--text-soft)]">
                          fp: {event.fingerprint}
                        </p>
                      )}
                      {renderEventPayload(event.type, payload, setExpandedScreenshot)}
                      <p className="mt-1 text-[10px] text-[var(--text-soft)]">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
            No events recorded in this session.
          </div>
        )}
      </div>

      {/* Screenshot lightbox */}
      {expandedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-8"
          onClick={() => setExpandedScreenshot(null)}
        >
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-panel)] shadow-lg"
              onClick={() => setExpandedScreenshot(null)}
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={expandedScreenshot}
              alt="Session screenshot"
              className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function parsePayload(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function formatEventType(type: string): string {
  return type
    .replace(/^frustration_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function renderEventPayload(
  type: string,
  payload: Record<string, unknown> | null,
  setExpand: (s: string | null) => void,
) {
  if (!payload) return null

  if (type === 'screenshot') {
    const dataUrl = typeof payload.data === 'string' && payload.data.startsWith('data:')
      ? payload.data
      : typeof payload.cloudinaryUrl === 'string'
        ? payload.cloudinaryUrl
        : null
    const reason = typeof payload.reason === 'string' ? payload.reason : 'unknown'

    if (dataUrl) {
      return (
        <div className="mt-2">
          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Reason: {reason}</div>
          {typeof payload.cloudinaryUrl === 'string' && (
            <div className="mb-1 text-[10px] text-[var(--text-soft)]">Stored on Cloudinary</div>
          )}
          <div
            className="group relative inline-block cursor-pointer overflow-hidden rounded border border-[var(--border-soft)]"
            onClick={() => setExpand(dataUrl)}
          >
            <img
              src={dataUrl}
              alt="Screenshot"
              className="max-h-32 max-w-[200px] object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
              <ExternalLink className="h-5 w-5 text-white opacity-0 transition-all group-hover:opacity-100" />
            </div>
          </div>
        </div>
      )
    }
    // Fallback: show raw if data URL is missing
    return (
      <pre className="mt-2 max-h-24 overflow-auto rounded border border-[var(--border-soft)] bg-[var(--surface-panel)] p-2 text-[10px] text-[var(--text-muted)]">
        {JSON.stringify(payload, null, 2).slice(0, 300)}
      </pre>
    )
  }

  if (type === 'recording_mouse') {
    const count = typeof payload.count === 'number' ? payload.count : 0
    const sample = payload.events as Array<{ x: number; y: number; t: number }> | undefined
    const first = sample?.[0]
    const last = sample?.[sample.length - 1]
    const duration = first && last ? last.t - first.t : 0
    return (
      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)]">
        <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">
          {count} samples
        </span>
        {duration > 0 && (
          <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">
            {(duration / 1000).toFixed(1)}s span
          </span>
        )}
        {first && (
          <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">
            ({Math.round(first.x)}, {Math.round(first.y)}) → ({Math.round(last?.x ?? 0)}, {Math.round(last?.y ?? 0)})
          </span>
        )}
      </div>
    )
  }

  if (type === 'recording_click') {
    const x = typeof payload.x === 'number' ? Math.round(payload.x) : '?'
    const y = typeof payload.y === 'number' ? Math.round(payload.y) : '?'
    const target = typeof payload.target === 'string' ? payload.target : null
    return (
      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)]">
        <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">
          ({x}, {y})
        </span>
        {target && (
          <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">
            {target}
          </span>
        )}
      </div>
    )
  }

  if (type === 'recording_scroll') {
    const x = typeof payload.x === 'number' ? Math.round(payload.x) : '?'
    const y = typeof payload.y === 'number' ? Math.round(payload.y) : '?'
    return (
      <div className="mt-1 text-[10px] text-[var(--text-muted)]">
        Scroll to ({x}, {y})
      </div>
    )
  }

  if (type.startsWith('frustration_')) {
    return (
      <div className="mt-1 space-y-0.5">
        {payload.element && (
          <div className="text-[10px] text-[var(--text-muted)]">
            Element: <span className="font-mono">{payload.element as string}</span>
          </div>
        )}
        {payload.count && (
          <div className="text-[10px] text-[var(--text-muted)]">
            Count: {payload.count as number}
          </div>
        )}
        {payload.text && (
          <div className="text-[10px] text-[var(--text-muted)]">
            Text: &ldquo;{payload.text as string}&rdquo;
          </div>
        )}
      </div>
    )
  }

  // Default: show payload as formatted JSON
  const formatted = JSON.stringify(payload, null, 2).slice(0, 300)
  if (!formatted || formatted === '{}') return null

  return (
    <pre className="mt-2 max-h-24 overflow-auto rounded border border-[var(--border-soft)] bg-[var(--surface-panel)] p-2 text-[10px] text-[var(--text-muted)]">
      {formatted}
    </pre>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
