import type { FrustrationOptions } from './types'

export type FrustrationHost = {
  track: (event: string, severity: number, properties?: Record<string, unknown>) => void
  requestScreenshot: (reason: string) => void
}

function hashString(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

function fingerprintElement(target: EventTarget | null): string {
  if (!target || !(target instanceof Element)) return ''
  const el = target as Element
  const parts = [
    el.tagName.toLowerCase(),
    el.id || '',
    ...Array.from(el.classList).sort(),
    el.getAttribute('href') || '',
    el.getAttribute('name') || '',
    el.getAttribute('type') || '',
    el.getAttribute('role') || '',
    el.textContent?.trim()?.slice(0, 60) || '',
    el.getAttribute('data-sonar-track') || '',
  ]
  return hashString(parts.join('|'))
}

function isInteractive(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  if (['a', 'button', 'input', 'select', 'textarea'].includes(tag)) return true
  const role = el.getAttribute('role')
  if (role === 'button' || role === 'link' || role === 'tab') return true
  if ((el as HTMLElement).onclick !== null) return true
  if (window.getComputedStyle(el).cursor === 'pointer') return true
  return false
}

function describe(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const text = el.textContent?.trim()?.slice(0, 80) || ''
  const id = el.id || ''
  const cls = Array.from(el.classList).slice(0, 3).join('.')
  return [tag, id, cls, text].filter(Boolean).join('#')
}

type SignalEntry = {
  type: string
  time: number
  severity: number
  data: Record<string, unknown>
}

type RageCfg = { enabled: boolean; threshold: number; windowMs: number }
type DeadCfg = { enabled: boolean; timeoutMs: number }
type HoverCfg = { enabled: boolean; thresholdMs: number }
type ScrollCfg = { enabled: boolean }
type CascadeCfg = { enabled: boolean; windowMs: number }

type ResolvedFrustrationOptions = {
  rageClick: RageCfg
  deadClick: DeadCfg
  hoverHesitation: HoverCfg
  scrollChaos: ScrollCfg
  cascadeDetection: CascadeCfg
}

export class FrustrationDetector {
  private host: FrustrationHost
  private opts: ResolvedFrustrationOptions
  private clickMap = new Map<string, number[]>()
  private signalWindow: SignalEntry[] = []
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private lastHoveredEl: Element | null = null
  private scrollHistory: Array<{ y: number; time: number }> = []
  private mutationObserver: MutationObserver | null = null
  private pendingDeadClick: { element: Element; fingerprint: string; time: number } | null = null
  private deadClickTimer: ReturnType<typeof setTimeout> | null = null
  private clickHandler: ((e: MouseEvent) => void) | null = null
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null
  private scrollHandler: (() => void) | null = null
  private active = false

  private defaults: ResolvedFrustrationOptions = {
    rageClick: { enabled: true, threshold: 3, windowMs: 2000 },
    deadClick: { enabled: true, timeoutMs: 2000 },
    hoverHesitation: { enabled: true, thresholdMs: 800 },
    scrollChaos: { enabled: true },
    cascadeDetection: { enabled: true, windowMs: 5000 },
  }

  constructor(host: FrustrationHost, opts?: FrustrationOptions) {
    this.host = host
    this.opts = this.resolveOpts(opts)
  }

  private resolveOpts(opts?: FrustrationOptions): ResolvedFrustrationOptions {
    const d = this.defaults
    const pick = <T extends Record<string, unknown>>(val: unknown, def: T): T => {
      if (val === false) return { ...def, enabled: false }
      if (typeof val === 'object' && val !== null) return { ...def, ...val }
      return def
    }
    return {
      rageClick: pick(opts?.rageClick, d.rageClick) as RageCfg,
      deadClick: pick(opts?.deadClick, d.deadClick) as DeadCfg,
      hoverHesitation: pick(opts?.hoverHesitation, d.hoverHesitation) as HoverCfg,
      scrollChaos: pick(opts?.scrollChaos, d.scrollChaos) as ScrollCfg,
      cascadeDetection: pick(opts?.cascadeDetection, d.cascadeDetection) as CascadeCfg,
    }
  }

  init() {
    if (this.active) return
    this.active = true

    this.clickHandler = (e: MouseEvent) => this.handleClick(e)
    document.addEventListener('click', this.clickHandler, { passive: true })

    this.mouseMoveHandler = (e: MouseEvent) => this.handleMouseMove(e)
    document.addEventListener('mousemove', this.mouseMoveHandler, { passive: true })

    this.scrollHandler = () => this.handleScroll()
    window.addEventListener('scroll', this.scrollHandler, { passive: true })
  }

  destroy() {
    this.active = false
    if (this.clickHandler) document.removeEventListener('click', this.clickHandler)
    if (this.mouseMoveHandler) document.removeEventListener('mousemove', this.mouseMoveHandler)
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler)
    this.stopDeadClick()
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.scrollHistory = []
    this.signalWindow = []
    this.clickMap.clear()
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as Element | null
    if (!target) return
    if ((target as HTMLElement).closest?.('[data-sonar-ignore]')) return

    const fp = fingerprintElement(target)
    if (!fp) return
    const now = Date.now()

    if (this.opts.rageClick.enabled) {
      const timestamps = this.clickMap.get(fp) || []
      timestamps.push(now)
      const recent = timestamps.filter(t => now - t <= this.opts.rageClick.windowMs)
      this.clickMap.set(fp, recent)

      if (recent.length >= this.opts.rageClick.threshold) {
        this.emit('frustration_rage_click', Math.min(0.5 + recent.length * 0.1, 0.95), {
          count: recent.length,
          windowMs: this.opts.rageClick.windowMs,
          fingerprint: fp,
          element: describe(target),
          tagName: target.tagName.toLowerCase(),
          text: target.textContent?.trim()?.slice(0, 100) || null,
          coords: { x: e.clientX, y: e.clientY },
        })
        return
      }
    }

    if (this.opts.deadClick.enabled && isInteractive(target)) {
      this.startDeadClick(target, fp)
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.opts.hoverHesitation.enabled) return
    const target = e.target as Element | null
    if (!target) return
    if (this.lastHoveredEl === target) return

    this.lastHoveredEl = target
    if (this.idleTimer) clearTimeout(this.idleTimer)

    if (isInteractive(target)) {
      this.idleTimer = setTimeout(() => {
        const el = document.elementFromPoint(e.clientX, e.clientY)
        if (el === target) {
          this.emit('frustration_hesitation', 0.3, {
            durationMs: this.opts.hoverHesitation.thresholdMs,
            fingerprint: fingerprintElement(target),
            element: describe(target),
            tagName: target.tagName.toLowerCase(),
            text: target.textContent?.trim()?.slice(0, 100) || null,
          })
        }
      }, this.opts.hoverHesitation.thresholdMs)
    }
  }

  private handleScroll() {
    if (!this.opts.scrollChaos.enabled) return
    const now = Date.now()
    this.scrollHistory.push({ y: window.scrollY, time: now })
    this.scrollHistory = this.scrollHistory.filter(s => now - s.time <= 3000)
    if (this.scrollHistory.length < 6) return

    let changes = 0
    for (let i = 2; i < this.scrollHistory.length; i++) {
      const d1 = this.scrollHistory[i - 1].y - this.scrollHistory[i - 2].y
      const d2 = this.scrollHistory[i].y - this.scrollHistory[i - 1].y
      if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) changes++
    }

    if (changes >= 3) {
      const first = this.scrollHistory[0]
      const last = this.scrollHistory[this.scrollHistory.length - 1]
      const dt = Math.max(last.time - first.time, 1)
      const velocity = Math.abs(last.y - first.y) / dt * 1000

      this.emit('frustration_scroll_chaos', Math.min(0.3 + changes * 0.05 + velocity * 0.00001, 0.8), {
        directionChanges: changes,
        velocity: Math.round(velocity),
        durationMs: dt,
      })
    }
  }

  private startDeadClick(el: Element, fp: string) {
    this.stopDeadClick()
    this.pendingDeadClick = { element: el, fingerprint: fp, time: Date.now() }

    this.mutationObserver = new MutationObserver(() => this.stopDeadClick())
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style'],
    })

    this.deadClickTimer = setTimeout(() => {
      if (this.pendingDeadClick) {
        this.emit('frustration_dead_click', 0.5, {
          fingerprint: this.pendingDeadClick.fingerprint,
          element: describe(this.pendingDeadClick.element),
          tagName: this.pendingDeadClick.element.tagName.toLowerCase(),
          text: this.pendingDeadClick.element.textContent?.trim()?.slice(0, 100) || null,
        })
      }
      this.stopDeadClick()
    }, this.opts.deadClick.timeoutMs)
  }

  private stopDeadClick() {
    this.pendingDeadClick = null
    this.mutationObserver?.disconnect()
    this.mutationObserver = null
    if (this.deadClickTimer) clearTimeout(this.deadClickTimer)
    this.deadClickTimer = null
  }

  private emit(type: string, severity: number, data: Record<string, unknown>) {
    const now = Date.now()
    this.signalWindow.push({ type, time: now, severity, data })
    this.signalWindow = this.signalWindow.filter(s => now - s.time <= 10000)

    this.host.track(type, severity, data)

    if (severity >= 0.5) this.host.requestScreenshot(type)

    if (this.opts.cascadeDetection.enabled) this.checkCascade(now)
  }

  private checkCascade(now: number) {
    const window = this.opts.cascadeDetection.windowMs
    const recent = this.signalWindow.filter(s => now - s.time <= window)
    if (recent.length < 3) return

    const types = new Set(recent.map(s => s.type))
    if (types.size >= 3) {
      const avg = recent.reduce((s, e) => s + e.severity, 0) / recent.length
      const cascadeSev = Math.min(avg + recent.length * 0.05, 0.98)

      this.host.track('frustration_cascade', cascadeSev, {
        signals: recent.map(s => ({ type: s.type, severity: s.severity })),
        count: recent.length,
        distinct: types.size,
        durationMs: now - recent[0].time,
      })
      this.signalWindow = []
    }
  }
}
