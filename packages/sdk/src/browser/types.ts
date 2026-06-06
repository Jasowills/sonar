export type ConsentState = 'granted' | 'denied' | 'pending'

export type ConsentBannerOptions = {
  position?: 'bottom' | 'bottom-left' | 'bottom-right' | 'top'
  text?: string
  acceptText?: string
  declineText?: string
  privacyPolicyUrl?: string
  theme?: 'light' | 'dark'
}

export type AutoTrackOptions = {
  pageViews?: boolean
  linkClicks?: boolean
  formSubmissions?: boolean
  scrollDepth?: boolean
  consoleErrors?: boolean
  clickTracking?: boolean
}

export type SessionRecorderOptions = {
  enabled?: boolean
  sampleIntervalMs?: number
}

export type ScreenshotOptions = {
  enabled?: boolean
  onError?: boolean
  quality?: number
}

export type FrustrationRageClickOptions = {
  enabled?: boolean
  threshold?: number
  windowMs?: number
}

export type FrustrationDeadClickOptions = {
  enabled?: boolean
  timeoutMs?: number
}

export type FrustrationHesitationOptions = {
  enabled?: boolean
  thresholdMs?: number
}

export type FrustrationScrollChaosOptions = {
  enabled?: boolean
}

export type FrustrationCascadeOptions = {
  enabled?: boolean
  windowMs?: number
}

export type FrustrationOptions = {
  rageClick?: boolean | FrustrationRageClickOptions
  deadClick?: boolean | FrustrationDeadClickOptions
  hoverHesitation?: boolean | FrustrationHesitationOptions
  scrollChaos?: boolean | FrustrationScrollChaosOptions
  cascadeDetection?: boolean | FrustrationCascadeOptions
}

export type SmartScreenshotTriggers = {
  onError?: boolean
  onRageClick?: boolean
  onDeadClick?: boolean
  onUnload?: boolean
  onCriticalAction?: boolean
}

export type SmartScreenshotOptions = {
  enabled?: boolean
  quality?: number
  maxWidth?: number
  triggers?: SmartScreenshotTriggers
}

export type IntelligenceOptions = {
  frustration?: boolean | FrustrationOptions
  screenshots?: boolean | SmartScreenshotOptions
}

export type SonarWebOptions = {
  apiKey: string
  endpoint?: string
  autoTrack?: boolean | AutoTrackOptions
  captureScreenshots?: boolean | ScreenshotOptions
  sessionRecording?: boolean | SessionRecorderOptions
  consent?: {
    banner?: boolean | ConsentBannerOptions
  }
  release?: string
  intelligence?: IntelligenceOptions
}

export type AnalyticsEventPayload = {
  type: string
  category?: string
  name?: string
  url: string
  referrer?: string
  userAgent?: string
  viewportWidth?: number
  viewportHeight?: number
  screenWidth?: number
  screenHeight?: number
  payload?: string
  sessionId?: string
  visitorId?: string
  consentGranted?: boolean
  timestamp: string
  severity?: number
  fingerprint?: string
}

export type AnalyticsSessionPayload = {
  visitorId?: string
  sessionId?: string
  startUrl: string
  referrer?: string
  userAgent?: string
  pageViews?: number
  eventCount?: number
  isBounce?: boolean
}
