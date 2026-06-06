import type { SessionRecorderOptions } from './types'

export type RecorderHost = {
  track: (event: string, properties?: Record<string, unknown>) => void
}

type MouseEventData = {
  x: number
  y: number
  t: number
}

export class SessionRecorder {
  private host: RecorderHost
  private opts: SessionRecorderOptions
  private mouseEvents: MouseEventData[] = []
  private mouseHandler: ((e: MouseEvent) => void) | null = null
  private scrollHandler: (() => void) | null = null
  private clickHandler: ((e: MouseEvent) => void) | null = null
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private active = false

  constructor(host: RecorderHost, opts: SessionRecorderOptions) {
    this.host = host
    this.opts = {
      enabled: opts.enabled ?? true,
      sampleIntervalMs: opts.sampleIntervalMs ?? 100,
    }
  }

  init() {
    if (this.active || !this.opts.enabled) return
    this.active = true

    this.mouseHandler = (e: MouseEvent) => {
      const now = Date.now()
      const last = this.mouseEvents[this.mouseEvents.length - 1]
      if (last && (now - last.t) < this.opts.sampleIntervalMs!) return
      this.mouseEvents.push({ x: e.clientX, y: e.clientY, t: now })
    }
    document.addEventListener('mousemove', this.mouseHandler)

    this.scrollHandler = () => {
      this.host.track('recording_scroll', {
        x: window.scrollX,
        y: window.scrollY,
      })
    }
    window.addEventListener('scroll', this.scrollHandler)

    this.clickHandler = (e: MouseEvent) => {
      this.host.track('recording_click', {
        x: e.clientX,
        y: e.clientY,
        target: (e.target as HTMLElement)?.tagName?.toLowerCase() ?? null,
      })
    }
    document.addEventListener('click', this.clickHandler)

    this.flushTimer = setInterval(() => this.flushMouseEvents(), 10_000)
  }

  destroy() {
    this.active = false
    if (this.mouseHandler) document.removeEventListener('mousemove', this.mouseHandler)
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler)
    if (this.clickHandler) document.removeEventListener('click', this.clickHandler)
    if (this.flushTimer) clearInterval(this.flushTimer)
    this.flushMouseEvents()
  }

  private flushMouseEvents() {
    if (this.mouseEvents.length === 0) return
    const batch = this.mouseEvents.splice(0, this.mouseEvents.length)
    this.host.track('recording_mouse', {
      events: batch,
      count: batch.length,
    })
  }
}
