import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAnalyticsSession, useAnalyticsSessionEvents, useAnalyzeSession } from '@/lib/api'
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
  Watch,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  Clock,
  Users,
  Monitor,
  Smartphone,
  Laptop,
  Globe,
  Eye,
  ChevronRight,
  ArrowLeft,
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

function severityBadge(severity: number | null): { bg: string; border: string; text: string; label: string } {
  if (severity === null || severity === 0) return { bg: '', border: '', text: '', label: '' }
  if (severity >= 0.8) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', label: `${(severity * 100).toFixed(0)}%` }
  if (severity >= 0.5) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', label: `${(severity * 100).toFixed(0)}%` }
  return { bg: 'bg-[var(--surface-panel-soft)]', border: 'border-[var(--border-soft)]', text: 'text-[var(--text-soft)]', label: `${(severity * 100).toFixed(0)}%` }
}

function typeColor(type: string): { icon: string; ring: string; bg: string } {
  if (type === 'page_view') return { icon: 'text-blue-500', ring: 'ring-blue-500/20', bg: 'bg-blue-500/10' }
  if (type === 'click' || type === 'recording_click') return { icon: 'text-emerald-500', ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10' }
  if (type === 'scroll' || type === 'recording_scroll') return { icon: 'text-teal-500', ring: 'ring-teal-500/20', bg: 'bg-teal-500/10' }
  if (type === 'form_submit') return { icon: 'text-violet-500', ring: 'ring-violet-500/20', bg: 'bg-violet-500/10' }
  if (type === 'console_error') return { icon: 'text-red-500', ring: 'ring-red-500/20', bg: 'bg-red-500/10' }
  if (type === 'screenshot' || type === 'recording_mouse') return { icon: 'text-zinc-500', ring: 'ring-zinc-500/20', bg: 'bg-zinc-500/10' }
  if (type.startsWith('frustration_')) return { icon: 'text-amber-500', ring: 'ring-amber-500/20', bg: 'bg-amber-500/10' }
  return { icon: 'text-[var(--text-muted)]', ring: 'ring-[var(--border-soft)]', bg: 'bg-[var(--surface-panel)]' }
}

function groupEvents(events: AnalyticsEvent[]): Array<{ events: AnalyticsEvent[] }> {
  const groups: Array<{ events: AnalyticsEvent[] }> = []
  for (const event of events) {
    const last = groups[groups.length - 1]
    if (last && last.events[0].type === event.type) {
      last.events.push(event)
    } else {
      groups.push({ events: [event] })
    }
  }
  return groups
}

function formatOffset(startMs: number, eventMs: number): string {
  const diff = eventMs - startMs
  if (diff < 0) return '0s'
  if (diff < 1000) return `+${diff}ms`
  const sec = diff / 1000
  if (sec < 60) return `+${sec.toFixed(1)}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `+${m}m ${s}s`
}

export function AnalyticsSessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session, isLoading: loadingSession, isError: sessionError } = useAnalyticsSession(id)
  const { data: events, isLoading: loadingEvents } = useAnalyticsSessionEvents(id)
  const { data: aiInsight, isLoading: aiLoading } = useAnalyzeSession(id)
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null)
  const [showAi, setShowAi] = useState(false)

  if (loadingSession || loadingEvents) {
    return <PageNotice variant="loading" message="Loading session…" />
  }

  if (sessionError || !session) {
    return <PageNotice variant="error" message="Session not found." />
  }

  const DeviceIcon = session.device === 'mobile' ? Smartphone : session.device === 'tablet' ? Laptop : Monitor

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a
          href="/app/analytics/sessions"
          className="inline-flex items-center gap-1.5 rounded border border-[var(--border-soft)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </a>
        <ChevronRight className="h-3 w-3 text-[var(--text-soft)]" />
        <span className="font-mono text-xs text-[var(--text-main)]">
          {session.visitorId ? session.visitorId.slice(0, 12) : 'Anonymous'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {session.videoUrl ? (
            <div className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-black">
              <video
                src={session.videoUrl}
                controls
                className="w-full"
                preload="metadata"
              >
                Your browser does not support video playback.
              </video>
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel-soft)]">
                <Eye className="h-6 w-6 text-[var(--text-muted)]" />
              </div>
              <p className="mt-4 text-sm font-medium text-[var(--text-muted)]">No recording available</p>
              <p className="mt-1 max-w-xs text-center text-xs text-[var(--text-soft)]">
                Session recordings require visual tracking to be enabled in the SDK.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="border border-[var(--border-soft)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Session</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-main)]">
              {session.duration ? formatDuration(session.duration) : '-'}
            </p>
            <p className="text-xs text-[var(--text-soft)]">Duration</p>
          </div>

          <div className="border border-[var(--border-soft)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Pages</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-main)]">{session.pageViews}</p>
            <p className="text-xs text-[var(--text-soft)]">Page views</p>
          </div>

          <div className="border border-[var(--border-soft)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Frustration</p>
            <p className={`mt-2 text-2xl font-bold ${
              (session.frustrationScore ?? 0) >= 50 ? 'text-red-500' :
              (session.frustrationScore ?? 0) >= 20 ? 'text-amber-500' :
              'text-[var(--text-main)]'
            }`}>
              {session.frustrationScore != null ? `${session.frustrationScore}/100` : '-'}
            </p>
            <p className="text-xs text-[var(--text-soft)]">Score</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="border border-[var(--border-soft)] p-3 text-center">
              <Flame className="mx-auto mb-1 h-4 w-4 text-amber-500" />
              <p className="text-sm font-bold text-[var(--text-main)]">{session.totalRageClicks || 0}</p>
              <p className="text-[10px] text-[var(--text-soft)]">Rage</p>
            </div>
            <div className="border border-[var(--border-soft)] p-3 text-center">
              <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-amber-500" />
              <p className="text-sm font-bold text-[var(--text-main)]">{session.totalDeadClicks || 0}</p>
              <p className="text-[10px] text-[var(--text-soft)]">Dead</p>
            </div>
            <div className="border border-[var(--border-soft)] p-3 text-center">
              <AlertCircle className="mx-auto mb-1 h-4 w-4 text-red-500" />
              <p className="text-sm font-bold text-[var(--text-main)]">{session.totalErrors || 0}</p>
              <p className="text-[10px] text-[var(--text-soft)]">Errors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-[var(--border-soft)]">
          <div className="border-b border-[var(--border-soft)] px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Visitor</p>
          </div>
          <div className="divide-y divide-[var(--border-soft)] text-xs">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[var(--text-muted)]">Visitor ID</span>
              <span className="font-mono text-[var(--text-main)]">
                {session.visitorId ? session.visitorId.slice(0, 24) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[var(--text-muted)]">Entry page</span>
              <span className="max-w-[200px] truncate text-[var(--text-main)]" title={session.startUrl}>
                {session.startUrl ? new URL(session.startUrl).pathname : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[var(--text-muted)]">Referrer</span>
              <span className="text-[var(--text-main)]">{session.referrer || 'Direct'}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[var(--text-muted)]">Started</span>
              <span className="text-[var(--text-main)]">
                {new Date(session.startedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-[var(--border-soft)]">
          <div className="border-b border-[var(--border-soft)] px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Device & Environment</p>
          </div>
          <div className="divide-y divide-[var(--border-soft)] text-xs">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[var(--text-muted)]">Browser</span>
              <span className="inline-flex items-center gap-1.5 text-[var(--text-main)]">
                <Globe className="h-3 w-3 text-[var(--text-soft)]" />
                {session.browser || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[var(--text-muted)]">OS</span>
              <span className="text-[var(--text-main)]">{session.os || '-'}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[var(--text-muted)]">Device</span>
              <span className="inline-flex items-center gap-1.5 text-[var(--text-main)]">
                <DeviceIcon className="h-3 w-3 text-[var(--text-soft)]" />
                {session.device || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[var(--text-muted)]">Country</span>
              <span className="text-[var(--text-main)]">{session.country || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {aiLoading && (
        <div className="flex items-center gap-3 border border-[var(--border-soft)] px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">Analyzing session...</p>
        </div>
      )}

      {aiInsight && !showAi && (
        <button
          onClick={() => setShowAi(true)}
          className="flex w-full items-center justify-between border border-[var(--border-soft)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface-panel-soft)]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--dot-degraded)]" />
            <span className="text-sm font-semibold text-[var(--text-main)]">AI session analysis</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
        </button>
      )}

      {aiInsight && showAi && (
        <div className="border border-[var(--border-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--dot-degraded)]" />
              <p className="text-sm font-semibold text-[var(--text-main)]">AI session analysis</p>
            </div>
            <button
              onClick={() => setShowAi(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              Hide
            </button>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">{aiInsight.summary}</p>

            {aiInsight.keyMoments.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Key moments</p>
                <ul className="space-y-1">
                  {aiInsight.keyMoments.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiInsight.frustrationHotspots.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Frustration hotspots</p>
                <ul className="space-y-1">
                  {aiInsight.frustrationHotspots.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-500">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiInsight.recommendation && (
              <div className="mt-4 border-l-2 border-[var(--dot-degraded)] bg-[var(--surface-panel-soft)] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Recommendation</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{aiInsight.recommendation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border border-[var(--border-soft)]">
        <div className="border-b border-[var(--border-soft)] px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
            <Activity className="h-4 w-4 text-[var(--text-muted)]" />
            Event timeline
            <span className="ml-1 text-xs font-normal text-[var(--text-soft)]">({events?.length ?? 0} events)</span>
          </h3>
        </div>
        {events && events.length > 0 ? (
          <div className="relative">
            {(() => {
              const sessionStart = new Date(session.startedAt).getTime()
              const sessionEnd = session.duration
                ? sessionStart + session.duration * 1000
                : new Date(events[events.length - 1].timestamp).getTime()
              const totalSpan = sessionEnd - sessionStart

              return (
                <div className="border-b border-[var(--border-soft)] px-5 py-3">
                  <div className="relative h-2 rounded-full bg-[var(--surface-panel-soft)]">
                    {events.map((event) => {
                      const pct = Math.max(0, Math.min(100, ((new Date(event.timestamp).getTime() - sessionStart) / totalSpan) * 100))
                      const tc = typeColor(event.type)
                      return (
                        <div
                          key={event.id}
                          className={`absolute top-0 h-2 w-2 -translate-x-1/2 rounded-full ${tc.icon.replace('text-', 'bg-')}`}
                          style={{ left: `${pct}%` }}
                          title={`${formatEventType(event.type)} at ${new Date(event.timestamp).toLocaleTimeString()}`}
                        />
                      )
                    })}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[9px] text-[var(--text-soft)]">
                    <span>+0s</span>
                    <span>{session.duration ? formatDuration(session.duration) : ''}</span>
                  </div>
                </div>
              )
            })()}

            <div className="absolute left-[37px] top-[61px] h-full w-px bg-[var(--border-soft)]" />
            <div className="divide-y divide-[var(--border-soft)]">
              {groupEvents(events).map((group) => {
                const first = group.events[0]
                const EventIcon = typeIcons[first.type] ?? Activity
                const payload = parsePayload(first.payload)
                const badge = severityBadge(first.severity)
                const tc = typeColor(first.type)
                const sessionStart = new Date(session.startedAt).getTime()
                const isGroup = group.events.length > 1

                return (
                  <div
                    key={first.id}
                    className={`relative flex gap-4 px-5 py-3 transition-colors hover:bg-[var(--surface-panel-soft)] ${badge.bg}`}
                  >
                    <div className={`relative z-10 mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ring-2 ${tc.ring} ${tc.bg}`}>
                      <EventIcon className={`h-3.5 w-3.5 ${tc.icon}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[var(--text-main)]">
                          {formatEventType(first.type)}
                        </span>
                        {isGroup && (
                          <span className="rounded bg-[var(--surface-panel-soft)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-soft)]">
                            &times;{group.events.length}
                          </span>
                        )}
                        {badge.label && (
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        )}
                        <span className="ml-auto text-[10px] tabular-nums text-[var(--text-soft)]">
                          {formatOffset(sessionStart, new Date(first.timestamp).getTime())}
                        </span>
                      </div>
                      {!isGroup && first.name && (
                        <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--text-muted)]">
                          {first.name}
                        </p>
                      )}
                      {!isGroup && (
                        <p className="mt-0.5 truncate text-[10px] text-[var(--text-soft)]">
                          {first.url}
                        </p>
                      )}
                      {!isGroup && first.fingerprint && (
                        <p className="mt-0.5 text-[9px] font-mono text-[var(--text-soft)]">
                          fp: {first.fingerprint}
                        </p>
                      )}
                      {!isGroup && renderEventPayload(first.type, payload, setExpandedScreenshot)}
                      {isGroup && (
                        <div className="mt-1.5 space-y-0.5">
                          {group.events.slice(0, 5).map((ev) => (
                            <p key={ev.id} className="truncate text-[10px] text-[var(--text-soft)]">
                              {formatOffset(sessionStart, new Date(ev.timestamp).getTime())}
                              {ev.url && <> &middot; {ev.url}</>}
                            </p>
                          ))}
                          {group.events.length > 5 && (
                            <p className="text-[10px] text-[var(--text-muted)]">
                              +{group.events.length - 5} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-16">
            <Activity className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm font-medium text-[var(--text-main)]">No events recorded</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              This session has no tracked events.
            </p>
          </div>
        )}
      </div>

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
        <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">{count} samples</span>
        {duration > 0 && (
          <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">{(duration / 1000).toFixed(1)}s span</span>
        )}
        {first && (
          <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">
            ({Math.round(first.x)}, {Math.round(first.y)}) &rarr; ({Math.round(last?.x ?? 0)}, {Math.round(last?.y ?? 0)})
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
        <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">({x}, {y})</span>
        {target && (
          <span className="rounded border border-[var(--border-soft)] px-1.5 py-0.5">{target}</span>
        )}
      </div>
    )
  }

  if (type === 'recording_scroll') {
    const x = typeof payload.x === 'number' ? Math.round(payload.x) : '?'
    const y = typeof payload.y === 'number' ? Math.round(payload.y) : '?'
    return (
      <div className="mt-1 text-[10px] text-[var(--text-muted)]">Scroll to ({x}, {y})</div>
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
        {payload.count && <div className="text-[10px] text-[var(--text-muted)]">Count: {payload.count as number}</div>}
        {payload.text && (
          <div className="text-[10px] text-[var(--text-muted)]">
            Text: &ldquo;{payload.text as string}&rdquo;
          </div>
        )}
      </div>
    )
  }

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
