import type { VideoRecorderOptions } from './types'
import { ensureHtml2canvas, captureViewport } from './screenshot'

export type VideoRecorderHost = {
  sessionId: string
  apiKey: string
  endpoint: string
}

function getMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const mt of ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']) {
    if (MediaRecorder.isTypeSupported(mt)) return mt
  }
  return ''
}

export class VideoRecorder {
  private host: VideoRecorderHost
  private opts: Required<VideoRecorderOptions>
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private stream: MediaStream | null = null
  private recorder: MediaRecorder | null = null
  private recorded: Blob | null = null
  private captureTimer: ReturnType<typeof setInterval> | null = null
  private active = false
  private destroyed = false
  private unloadHandler: (() => void) | null = null

  constructor(host: VideoRecorderHost, opts: VideoRecorderOptions) {
    this.host = host
    this.opts = {
      enabled: opts.enabled ?? true,
      fps: opts.fps ?? 1,
      quality: opts.quality ?? 0.6,
      maxWidth: opts.maxWidth ?? 1280,
    }
  }

  async init() {
    if (this.active || !this.opts.enabled) return
    const mimeType = getMimeType()
    if (!mimeType) return

    const ok = await ensureHtml2canvas()
    if (!ok) return

    this.active = true

    const scale = Math.min(1, this.opts.maxWidth / window.innerWidth)
    this.canvas = document.createElement('canvas')
    this.canvas.width = Math.round(window.innerWidth * scale)
    this.canvas.height = Math.round(window.innerHeight * scale)
    Object.assign(this.canvas.style, {
      position: 'fixed', left: '-9999px', top: '0',
      pointerEvents: 'none',
    })
    document.body.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
    this.stream = this.canvas.captureStream(this.opts.fps)

    this.recorder = new MediaRecorder(this.stream, { mimeType })
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recorded = e.data
    }
    this.recorder.start()

    this.captureTimer = setInterval(() => this.captureFrame(), 1000 / this.opts.fps)

    this.unloadHandler = () => this.destroy()
    window.addEventListener('beforeunload', this.unloadHandler)
  }

  private async captureFrame() {
    if (this.destroyed || !this.ctx || !this.canvas) return
    try {
      const dataUrl = await captureViewport()
      if (!dataUrl) return
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = dataUrl
      })
      this.ctx!.drawImage(img, 0, 0, this.canvas!.width, this.canvas!.height)
    } catch {
      // skip frame
    }
  }

  private async upload() {
    if (!this.recorded) return
    const blob = this.recorded
    this.recorded = null

    try {
      const formData = new FormData()
      formData.append('video', blob, `session-${this.host.sessionId}.webm`)
      formData.append('sessionId', this.host.sessionId)

      fetch(`${this.host.endpoint}/ingest/session-video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.host.apiKey}` },
        body: formData,
        keepalive: true,
      })
    } catch {
      // upload failed, best-effort
    }
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.active = false

    if (this.unloadHandler) window.removeEventListener('beforeunload', this.unloadHandler)
    if (this.captureTimer) clearInterval(this.captureTimer)

    if (this.recorder?.state === 'recording') {
      this.recorder.stop()
    }

    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null

    setTimeout(() => this.upload(), 100)

    if (this.canvas?.parentNode) this.canvas.parentNode.removeChild(this.canvas)
  }
}
