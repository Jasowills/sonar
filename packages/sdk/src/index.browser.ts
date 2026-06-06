export { SonarWeb } from './browser/sonar-web'
export { ConsentManager } from './browser/consent'
export { BatchTransport } from './browser/transport'
export { VisitorManager } from './browser/visitor'
export { AutoTracker } from './browser/auto'
export { SmartScreenshotCapture } from './browser/screenshot'
export { SessionRecorder } from './browser/session-recorder'
export { FrustrationDetector } from './browser/frustration'
export type {
  SonarWebOptions,
  ConsentState,
  ConsentBannerOptions,
  AutoTrackOptions,
  SessionRecorderOptions,
  ScreenshotOptions,
  AnalyticsEventPayload,
  AnalyticsSessionPayload,
  FrustrationOptions,
  SmartScreenshotOptions,
  IntelligenceOptions,
} from './browser/types'

export { SonarClient } from './client'
export type { SonarOptions, CaptureErrorOptions, RecordDeploymentOptions } from './types'
