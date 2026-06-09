import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Users,
  Flame,
  AlertTriangle,
  Activity,
  MousePointerClick,
  ScrollText,
  FileText,
  AlertCircle,
  FormInput,
  Target,
  Camera,
  Watch,
  X,
  Play,
  Clock,
  Smartphone,
  Monitor,
  Laptop,
  ChevronRight,
} from 'lucide-react'
import { useAnalyticsSessions, useAnalyticsSession, useAnalyticsSessionEvents } from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { PageNotice } from '@/components/page-notice'
import { timeAgo } from '@/lib/format'

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

export function AnalyticsSessionsPage() {
  const { project } = useSelectedProject()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [limit] = useState(50)
  const { data: sessions, isLoading: loadingList, isError: listError } = useAnalyticsSessions(project?.id, limit)

  if (loadingList) {
    return <PageNotice variant="loading" message="Loading sessions…" />
  }

  if (listError) {
    return <PageNotice variant="error" message="Could not load sessions." />
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col overflow-hidden border border-[var(--border-soft)] bg-[var(--surface-page)]">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Session List */}
        <div className="w-[320px] flex-shrink-0 border-r border-[var(--border-soft)] bg-[var(--surface-panel)] overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Sessions ({sessions?.length ?? 0})
            </h3>
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            {sessions?.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                isActive={id === s.id}
                onClick={() => navigate(`/app/analytics/sessions/${s.id}`)}
              />
            ))}
            {(!sessions || sessions.length === 0) && (
              <div className="px-4 py-12 text-center text-sm text-[var(--text-soft)]">
                No sessions found.
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Session Detail */}
        <div className="flex-1 overflow-y-auto bg-[var(--surface-page)] relative">
          {id ? (
            <SessionDetailView id={id} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-panel)] border border-[var(--border-soft)]">
                <Play className="h-6 w-6 text-[var(--text-muted)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-main)]">Select a session</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)] max-w-xs">
                Pick a session from the list on the left to view the recording and event timeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SessionCard({ session, isActive, onClick }: { session: any; isActive: boolean; onClick: () => void }) {
  const DeviceIcon = session.device === 'mobile' ? Smartphone : session.device === 'tablet' ? Laptop : Monitor

  return (
    <div
      onClick={onClick}
      className={`group relative flex cursor-pointer flex-col gap-2 p-4 transition-colors ${
        isActive
          ? 'bg-[var(--accent-main)]/10 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--accent-main)]'
          : 'hover:bg-[var(--surface-panel-soft)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium text-[var(--text-main)]">
          {session.visitorId ? session.visitorId.slice(0, 12) : 'Anonymous'}
        </span>
        <span className="text-[10px] text-[var(--text-soft)]">{timeAgo(session.startedAt)}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <DeviceIcon className="h-3 w-3" />
        <span className="truncate max-w-[180px]">{session.startUrl}</span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <Clock className="h-2.5 w-2.5" />
            {session.duration ? formatDuration(session.duration) : '-'}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <Activity className="h-2.5 w-2.5" />
            {session.pageViews}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {session.totalRageClicks > 0 && <Flame className="h-3 w-3 text-amber-500" />}
          {session.hasErrors && <AlertCircle className="h-3 w-3 text-red-500" />}
          {session.frustrationScore != null && (
            <div className={`text-[10px] font-bold ${
              session.frustrationScore >= 50 ? 'text-red-500' :
              session.frustrationScore >= 20 ? 'text-amber-500' :
              'text-[var(--text-soft)]'
            }`}>
              {session.frustrationScore}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SessionDetailView({ id }: { id: string }) {
  const { data: session, isLoading: loadingSession, isError: sessionError } = useAnalyticsSession(id)
  const { data: events, isLoading: loadingEvents } = useAnalyticsSessionEvents(id)
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null)

  if (loadingSession || loadingEvents) {
    return (
      <div className="flex h-full items-center justify-center">
        <PageNotice variant="loading" message="Loading session data…" />
      </div>
    )
  }

  if (sessionError || !session) {
    return (
      <div className="flex h-full items-center justify-center">
        <PageNotice variant="error" message="Session not found." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Detail Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-panel)] px-6 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-[var(--text-main)]">
              {session.startUrl}
            </h2>
            {session.videoUrl && (
               <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-bold uppercase tracking-wider border border-blue-500/20 flex items-center gap-1">
                 <Play className="h-2 w-2 fill-current" /> Recording
               </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            <span>{new Date(session.startedAt).toLocaleString()}</span>
            <span>•</span>
            <span>{[session.browser, session.os, session.device].filter(Boolean).join(' · ')}</span>
            {session.visitorId && (
              <>
                <span>•</span>
                <span className="font-mono">{session.visitorId}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Player & Info */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Video Player Section */}
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-[var(--border-soft)] bg-black shadow-2xl relative group">
            {session.videoUrl ? (
              <video
                src={session.videoUrl}
                controls
                className="h-full w-full"
                autoPlay
                preload="auto"
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-12 text-center text-[var(--text-muted)]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Play className="h-6 w-6 opacity-20" />
                </div>
                <p className="text-sm font-medium text-white/50">Video recording unavailable</p>
                <p className="mt-2 max-w-xs text-xs text-white/30">
                  Recordings are only available for sessions where visual tracking was enabled and successfully uploaded.
                </p>
              </div>
            )}
          </div>

          {/* Key Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Duration" value={session.duration ? formatDuration(session.duration) : '-'} />
            <StatBox label="Page views" value={session.pageViews} />
            <StatBox
              label="Frustration"
              value={session.frustrationScore ?? '-'}
              color={
                session.frustrationScore >= 50 ? 'text-red-500' :
                session.frustrationScore >= 20 ? 'text-amber-500' :
                'text-[var(--text-main)]'
              }
            />
            <StatBox label="Errors" value={session.totalErrors || 0} color={session.totalErrors > 0 ? 'text-red-500' : ''} />
          </div>

          {/* Details & Metadata */}
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="border border-[var(--border-soft)] p-4 rounded-lg bg-[var(--surface-panel)]">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">User Details</h4>
              <div className="space-y-2">
                <DetailRow label="Browser" value={session.browser} />
                <DetailRow label="OS" value={session.os} />
                <DetailRow label="Device" value={session.device} />
                <DetailRow label="Referrer" value={session.referrer || 'Direct'} />
              </div>
            </div>
            <div className="border border-[var(--border-soft)] p-4 rounded-lg bg-[var(--surface-panel)]">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Insights</h4>
              <div className="space-y-2">
                <DetailRow label="Intent" value={session.userIntent || 'Analyzing...'} />
                <DetailRow label="Economic Impact" value={session.economicImpact ? `$${session.economicImpact}` : '-'} />
                <DetailRow label="Rage Clicks" value={session.totalRageClicks || 0} />
                <DetailRow label="Dead Clicks" value={session.totalDeadClicks || 0} />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Sidebar (Clarity style) */}
        <div className="w-[360px] flex-shrink-0 border-l border-[var(--border-soft)] bg-[var(--surface-panel)] overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Timeline ({events?.length ?? 0} events)
            </h3>
          </div>
          <div className="divide-y divide-[var(--border-soft)]/50">
            {events?.map((event) => {
              const EventIcon = typeIcons[event.type] ?? Activity
              const payload = parsePayload(event.payload)
              return (
                <div key={event.id} className={`px-5 py-3 hover:bg-[var(--surface-panel-soft)] transition-colors ${severityBg(event.severity)}`}>
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <EventIcon className={`h-3.5 w-3.5 ${severityColor(event.severity)}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[var(--text-main)]">
                          {formatEventType(event.type)}
                        </span>
                        <span className="text-[10px] text-[var(--text-soft)]">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      {event.name && <p className="mt-0.5 truncate text-[10px] text-[var(--text-soft)] font-medium">{event.name}</p>}
                      <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">{event.url}</p>
                      {renderEventPayload(event.type, payload, setExpandedScreenshot)}
                    </div>
                  </div>
                </div>
              )
            })}
            {(!events || events.length === 0) && (
              <div className="px-5 py-12 text-center text-xs text-[var(--text-soft)]">
                No events recorded for this session.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for screenshots */}
      {expandedScreenshot && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-12"
          onClick={() => setExpandedScreenshot(null)}
        >
          <div className="relative max-h-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -right-4 -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-xl"
              onClick={() => setExpandedScreenshot(null)}
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={expandedScreenshot}
              alt="Screenshot"
              className="max-h-[85vh] w-auto rounded border-4 border-white/10 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="border border-[var(--border-soft)] p-3 rounded-md bg-[var(--surface-panel)] text-left">
      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-tight">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color || 'text-[var(--text-main)]'}`}>{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-medium text-[var(--text-main)] truncate ml-4 max-w-[140px]" title={String(value)}>{value || '-'}</span>
    </div>
  )
}

function severityColor(severity: number | null): string {
  if (severity === null || severity === 0) return 'text-[var(--text-muted)]'
  if (severity >= 0.8) return 'text-red-500'
  if (severity >= 0.5) return 'text-amber-500'
  return 'text-[var(--text-soft)]'
}

function severityBg(severity: number | null): string {
  if (severity === null || severity === 0) return ''
  if (severity >= 0.8) return 'bg-red-500/5'
  if (severity >= 0.5) return 'bg-amber-500/5'
  return ''
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

    if (dataUrl) {
      return (
        <div
          className="mt-2 group relative cursor-pointer overflow-hidden rounded border border-[var(--border-soft)] w-fit"
          onClick={() => setExpand(dataUrl)}
        >
          <img src={dataUrl} alt="Preview" className="h-20 w-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-4 w-4 text-white" />
          </div>
        </div>
      )
    }
  }

  if (type === 'recording_click' || type === 'click') {
    return (
      <div className="mt-1 text-[10px] text-[var(--text-soft)] bg-white/5 p-1 rounded font-mono truncate">
        {payload.target || `x: ${payload.x}, y: ${payload.y}`}
      </div>
    )
  }

  return null
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
