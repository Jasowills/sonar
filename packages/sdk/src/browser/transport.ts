import type { AnalyticsEventPayload, AnalyticsSessionPayload } from './types'

const FLUSH_INTERVAL_MS = 5000
const MAX_BUFFER_SIZE = 50
const MAX_RETRIES = 3
const URGENT_SEVERITY_THRESHOLD = 0.8

export class BatchTransport {
  private buffer: AnalyticsEventPayload[] = []
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private endpoint: string
  private apiKey: string
  private session: AnalyticsSessionPayload | null = null
  private flushing = false

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey
    this.endpoint = `${endpoint.replace(/\/+$/, '')}/ingest/analytics`
    this.startAutoFlush()

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flushSync()
      })
      window.addEventListener('beforeunload', () => this.flushSync())
    }
  }

  setSession(session: AnalyticsSessionPayload | null) {
    this.session = session
  }

  push(event: AnalyticsEventPayload) {
    this.buffer.push(event)

    if (event.severity !== undefined && event.severity >= URGENT_SEVERITY_THRESHOLD) {
      this.flushUrgent()
    } else if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.flush()
    }
  }

  private startAutoFlush() {
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS)
  }

  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  private async send(payload: unknown): Promise<boolean> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        })
        if (res.ok) return true
        if (res.status >= 400 && res.status < 500) return false
      } catch {
        // retry
      }
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 200))
      }
    }
    return false
  }

  async flush() {
    if (this.flushing || this.buffer.length === 0) return
    this.flushing = true

    const batch = this.buffer.splice(0, this.buffer.length)
    const payload: Record<string, unknown> = { events: batch }
    if (this.session) payload.session = this.session
    await this.send(payload)
    this.flushing = false
  }

  async flushUrgent() {
    if (this.buffer.length === 0) return
    this.flushing = true

    const batch = this.buffer.splice(0, this.buffer.length)
    const payload: Record<string, unknown> = { events: batch }
    if (this.session) payload.session = this.session

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    } catch {
      // best-effort
    }
    this.flushing = false
  }

  private flushSync() {
    if (this.flushing || this.buffer.length === 0) return
    this.flushing = true

    const batch = this.buffer.splice(0, this.buffer.length)
    const payload: Record<string, unknown> = { events: batch }
    if (this.session) payload.session = this.session

    try {
      fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    } catch {
      // best-effort
    }
    this.flushing = false
  }
}
