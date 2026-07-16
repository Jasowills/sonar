import type { SonarWebOptions, AnalyticsEventPayload, ConsentState } from './types'
import { ConsentManager } from './consent'
import { VisitorManager } from './visitor'
import { BatchTransport } from './transport'
import { AutoTracker } from './auto'
import type { AutoTrackerHost } from './auto'
import { SessionRecorder } from './session-recorder'
import { VideoRecorder } from './video-recorder'
import { SmartScreenshotCapture, ensureHtml2canvas, captureViewport } from './screenshot'
import { FrustrationDetector } from './frustration'
import type { FrustrationHost } from './frustration'

export class SonarWeb implements AutoTrackerHost, FrustrationHost {
  private consent: ConsentManager
  private visitor: VisitorManager
  private transport: BatchTransport
  private autoTracker: AutoTracker | null = null
  private sessionRecorder: SessionRecorder | null = null
  private videoRecorder: VideoRecorder | null = null
  private smartScreenshot: SmartScreenshotCapture | null = null
  private frustrationDetector: FrustrationDetector | null = null
  private releaseUnlistenConsent: (() => void) | null = null
  private started = false

  constructor(options: SonarWebOptions) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('sonar-sdk browser module can only be used in a browser environment')
    }

    const endpoint = options.endpoint ?? 'https://sonar-api-xi.vercel.app'
    const bannerOpts = typeof options.consent?.banner === 'object' ? options.consent.banner : undefined
    this.consent = new ConsentManager(bannerOpts)
    this.visitor = new VisitorManager()
    this.transport = new BatchTransport(options.apiKey, endpoint)

    this.transport.setSession({
      visitorId: this.visitor.visitorId,
      sessionId: this.visitor.sessionId,
      startUrl: window.location.href,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      pageViews: 1,
      eventCount: 0,
      isBounce: true,
    })

    if (options.captureScreenshots) {
      const ssOpts = typeof options.captureScreenshots === 'object' ? { enabled: true, ...options.captureScreenshots } : { enabled: true }
      this.smartScreenshot = new SmartScreenshotCapture(ssOpts, this)
    }

    if (typeof options.autoTrack === 'object') {
      this.autoTracker = new AutoTracker(this, options.autoTrack)
    } else if (options.autoTrack === true) {
      this.autoTracker = new AutoTracker(this, {})
    }

    if (options.sessionRecording) {
      const srOpts = typeof options.sessionRecording === 'object' ? options.sessionRecording : {}
      this.sessionRecorder = new SessionRecorder(this, srOpts)
      const videoOpts = typeof srOpts.video === 'object' ? srOpts.video : srOpts.video === true ? {} : null
      if (videoOpts) {
        this.videoRecorder = new VideoRecorder(
          { sessionId: this.visitor.sessionId, apiKey: options.apiKey, endpoint },
          videoOpts,
        )
      }
    }

    if (options.intelligence) {
      this.initIntelligence(options.intelligence)
    }

    this.releaseUnlistenConsent = this.consent.onChange((state: ConsentState) => {
      if (state === 'granted') this.start()
      else this.stop()
    })

    this.consent.showBanner()

    if (this.consent.getConsent() === 'granted') {
      this.start()
    }
  }

  private initIntelligence(intel: NonNullable<SonarWebOptions['intelligence']>) {
    if (intel.frustration) {
      const frustOpts = intel.frustration === true ? {} : intel.frustration
      this.frustrationDetector = new FrustrationDetector(this, frustOpts)
    }

    if (intel.screenshots) {
      const ssOpts = intel.screenshots === true ? { enabled: true } : { enabled: true, ...intel.screenshots }
      this.smartScreenshot = new SmartScreenshotCapture(ssOpts, this)
    }
  }

  private start() {
    if (this.started) return
    this.started = true

    this.page('page_view', { title: document.title })

    this.autoTracker?.init()
    this.sessionRecorder?.init()
    this.videoRecorder?.init()
    this.frustrationDetector?.init()
  }

  private stop() {
    this.started = false
    this.autoTracker?.destroy()
    this.sessionRecorder?.destroy()
    this.videoRecorder?.destroy()
    this.frustrationDetector?.destroy()
  }

  // FrustrationHost.requestScreenshot
  requestScreenshot(reason: string) {
    if (reason === 'frustration_rage_click' || reason === 'frustration_cascade') {
      this.smartScreenshot?.capture(reason, 'high')
    } else if (reason === 'frustration_dead_click') {
      this.smartScreenshot?.capture(reason, 'normal')
    } else {
      this.smartScreenshot?.capture(reason, 'normal')
    }
  }

  identify(visitorId: string, traits?: Record<string, unknown>) {
    try { localStorage.setItem('sonar_visitor_id', visitorId) } catch { /* noop */ }
    this.track('identify', { ...traits, visitorId })
  }

  page(name?: string, properties?: Record<string, unknown>) {
    this.track('page_view', {
      ...properties,
      name: name ?? document.title,
      url: window.location.href,
    })
  }

  // AutoTrackerHost + FrustrationHost:
  // Normal calls: track('page_view', { title })
  // Frustration calls: track('rage_click', 0.85, { count: 5 })
  track(event: string, propertiesOrSeverity?: Record<string, unknown> | number, maybeProperties?: Record<string, unknown>) {
    this.visitor.touch()

    let severity = 0
    let props: Record<string, unknown> | undefined

    if (typeof propertiesOrSeverity === 'number') {
      severity = propertiesOrSeverity
      props = maybeProperties
    } else {
      props = propertiesOrSeverity
    }

    const payload: AnalyticsEventPayload = {
      type: event,
      category: 'manual',
      name: props?.name as string | undefined,
      url: window.location.href,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      payload: props ? JSON.stringify(props) : undefined,
      sessionId: this.visitor.sessionId,
      visitorId: this.visitor.visitorId,
      consentGranted: this.consent.getConsent() === 'granted',
      timestamp: new Date().toISOString(),
    }

    if (severity > 0) payload.severity = severity
    if (props?.name) payload.name = String(props.name)

    this.transport.push(payload)
  }

  async screenshot(): Promise<string | null> {
    const ok = await ensureHtml2canvas()
    if (!ok) return null
    return captureViewport()
  }

  setConsent(state: ConsentState) {
    this.consent.setConsent(state)
  }

  getConsent(): ConsentState {
    return this.consent.getConsent()
  }

  destroy() {
    this.transport.flush()
    this.transport.stop()
    this.autoTracker?.destroy()
    this.sessionRecorder?.destroy()
    this.videoRecorder?.destroy()
    this.frustrationDetector?.destroy()
    this.smartScreenshot?.destroy()
    this.consent.hideBanner()
    this.releaseUnlistenConsent?.()
    this.started = false
  }
}
