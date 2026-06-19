import type { SmartScreenshotOptions } from './types'

export type ScreenshotCallback = {
  track: (event: string, severity: number, properties?: Record<string, unknown>) => void
}

type Priority = 'critical' | 'high' | 'normal' | 'low'
type CaptureJob = { reason: string; priority: Priority; time: number }

const PRIORITY_ORDER: Record<Priority, number> = { critical: 0, high: 1, normal: 2, low: 3 }

function adaptiveQuality(): number {
  let q = 0.8
  const nav = navigator as unknown as { deviceMemory?: number; connection?: { downlink?: number } }
  if (nav.deviceMemory && nav.deviceMemory < 2) q = 0.3
  else if (nav.deviceMemory && nav.deviceMemory < 4) q = 0.5
  if (nav.connection?.downlink !== undefined && nav.connection.downlink < 0.5) q = Math.min(q, 0.3)
  else if (nav.connection?.downlink !== undefined && nav.connection.downlink < 1) q = Math.min(q, 0.5)
  return q
}

type Html2CanvasFn = (el: HTMLElement, opts?: Record<string, unknown>) => Promise<{ toDataURL: (type: string) => string } | string>

let html2canvasRef: Html2CanvasFn | null = null

async function loadHtml2canvas() {
  if (html2canvasRef) return
  try {
    // @ts-expect-error html2canvas is an optional peer dependency
    const mod = await import('html2canvas')
    html2canvasRef = mod.default as unknown as Html2CanvasFn
  } catch {
    const w = typeof window !== 'undefined' ? window as { html2canvas?: unknown } : undefined
    if (w?.html2canvas) html2canvasRef = w.html2canvas as Html2CanvasFn
  }
}

export async function ensureHtml2canvas(): Promise<boolean> {
  await loadHtml2canvas()
  return html2canvasRef !== null
}

export async function captureViewport(): Promise<string | null> {
  if (!html2canvasRef) return null
  try {
    const q = adaptiveQuality()
    const scale = Math.min(window.devicePixelRatio || 1, q > 0.5 ? 2 : 1)
    const result = await html2canvasRef(document.documentElement, {
      width: window.innerWidth,
      height: window.innerHeight,
      x: window.scrollX,
      y: window.scrollY,
      useCORS: true,
      scale,
      logging: false,
    })
    const dataUrl = typeof result === 'string' ? result : 'toDataURL' in result ? result.toDataURL('image/jpeg') : ''
    return dataUrl.slice(0, 500_000) || null
  } catch {
    return null
  }
}

type InternalScreenshotOptions = {
  enabled: boolean
  quality: number
  maxWidth: number
  triggers: {
    onError: boolean
    onRageClick: boolean
    onDeadClick: boolean
    onUnload: boolean
    onCriticalAction: boolean
  }
}

export class SmartScreenshotCapture {
  private callback: ScreenshotCallback | null = null
  private opts: InternalScreenshotOptions
  private queue: CaptureJob[] = []
  private capturing = false
  private lastErrorCapture = 0

  constructor(opts: SmartScreenshotOptions, callback?: ScreenshotCallback | null) {
    this.opts = {
      enabled: opts.enabled ?? true,
      quality: opts.quality ?? 0.8,
      maxWidth: opts.maxWidth ?? 1920,
      triggers: {
        onError: opts.triggers?.onError ?? true,
        onRageClick: opts.triggers?.onRageClick ?? true,
        onDeadClick: opts.triggers?.onDeadClick ?? true,
        onUnload: opts.triggers?.onUnload ?? true,
        onCriticalAction: opts.triggers?.onCriticalAction ?? true,
      },
    }
    this.callback = callback ?? null

    if (this.opts.triggers.onError) {
      window.addEventListener('error', () => this.capture('error', 'critical'))
    }

    if (this.opts.triggers.onUnload) {
      window.addEventListener('beforeunload', () => this.flushSync())
    }
  }

  capture(reason = 'manual', priority: Priority = 'normal') {
    if (!this.opts.enabled) return

    if (reason === 'error') {
      const now = Date.now()
      if (now - this.lastErrorCapture < 5000) return
      this.lastErrorCapture = now
    }

    this.queue.push({ reason, priority, time: Date.now() })
    this.queue.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    this.process()
  }

  private async process() {
    if (this.capturing || this.queue.length === 0 || !this.opts.enabled) return
    this.capturing = true
    await loadHtml2canvas()
    if (!html2canvasRef) { this.capturing = false; return }

    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      try {
        const q = this.opts.quality * adaptiveQuality()
        const scale = Math.min(window.devicePixelRatio || 1, q > 0.5 ? 2 : 1)
        const result = await html2canvasRef(document.documentElement, {
          width: window.innerWidth,
          height: window.innerHeight,
          x: window.scrollX,
          y: window.scrollY,
          useCORS: true,
          scale,
          logging: false,
        })
        const dataUrl = typeof result === 'string' ? result : 'toDataURL' in result ? result.toDataURL('image/jpeg') : ''
        const truncated = dataUrl.slice(0, 500_000)
        if (truncated) {
          this.callback?.track('screenshot', 0, {
            reason: job.reason,
            data: truncated,
          })
        }
      } catch {
        // skip
      }
    }
    this.capturing = false
  }

  private flushSync() {
    if (this.queue.length === 0 || !this.opts.enabled) return
    this.process()
  }

  destroy() {
    this.queue = []
  }
}
