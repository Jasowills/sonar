import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useNotifications,
  useUnreadCount,
  useMarkAllNotificationsRead,
} from '@/lib/api'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useEventSource } from '@/lib/event-source'

const TYPE_COLORS: Record<string, { dot: string; bg: string }> = {
  monitor_down: { dot: 'bg-[var(--dot-down)]', bg: 'bg-red-950/20' },
  monitor_up: { dot: 'bg-[var(--dot-healthy)]', bg: 'bg-green-950/20' },
  monitor_degraded: { dot: 'bg-[var(--dot-degraded)]', bg: 'bg-yellow-950/20' },
  incident_created: { dot: 'bg-[var(--dot-down)]', bg: 'bg-red-950/20' },
  incident_resolved: { dot: 'bg-[var(--dot-healthy)]', bg: 'bg-green-950/20' },
  deploy_completed: { dot: 'bg-[var(--dot-healthy)]', bg: 'bg-green-950/20' },
  alert_fired: { dot: 'bg-[var(--dot-degraded)]', bg: 'bg-yellow-950/20' },
  error_created: { dot: 'bg-[var(--dot-down)]', bg: 'bg-red-950/20' },
}

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? { dot: 'bg-[var(--text-soft)]', bg: 'bg-[var(--surface-panel-soft)]/50' }
}

let audioCtx: AudioContext | null = null

function playNotificationSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4)
    osc.frequency.setValueAtTime(660, audioCtx.currentTime)
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1)
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + 0.4)
  } catch {
    // audio not available
  }
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: notifications } = useNotifications()
  const { data: unreadCount } = useUnreadCount()
  const markAllRead = useMarkAllNotificationsRead()
  const { lastEvent } = useEventSource()
  const prevUnreadRef = useRef(0)

  // Refetch when SSE notification arrives
  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'notification' || lastEvent.type === 'error_created') {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    }
  }, [lastEvent, queryClient])

  // Play sound when unread count increases
  useEffect(() => {
    const prev = prevUnreadRef.current
    const current = unreadCount ?? 0
    if (current > prev && !open) {
      playNotificationSound()
    }
    prevUnreadRef.current = current
  }, [unreadCount, open])

  const unread = unreadCount ?? 0
  const items = notifications ?? []

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[14px] items-center justify-center bg-[var(--text-main)] px-1 text-[10px] font-bold text-[var(--surface-page)] leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side panel */}
      <div
        className={cn(
          'fixed bottom-0 right-0 top-0 z-[70] w-96 border-l border-[var(--border-soft)] bg-[var(--surface-page)] transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--text-muted)]" />
              <p className="text-sm font-semibold text-[var(--text-main)]">
                Notifications
              </p>
              {unread > 0 && (
                <span className="flex h-5 min-w-[18px] items-center justify-center bg-[var(--text-main)] px-1 text-[10px] font-bold text-[var(--surface-page)] leading-none">
                  {unread}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          {unread > 0 && (
            <div className="border-b border-[var(--border-soft)] px-5 py-2">
              <button
                onClick={() => markAllRead.mutateAsync()}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            </div>
          )}

          {/* List */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-16">
                <Bell className="mb-3 h-8 w-8 text-[var(--text-soft)]" />
                <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  You'll see alerts and updates here in real time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-soft)]">
                {items.map((n) => {
                  const tc = typeColor(n.type)
                  return (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-5 py-3.5 ${n.read ? '' : tc.bg}`}
                    >
                      <span
                        className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${tc.dot}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${n.read ? 'text-[var(--text-muted)]' : 'font-medium text-[var(--text-main)]'}`}
                        >
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-[var(--text-soft)]">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--text-main)]" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
