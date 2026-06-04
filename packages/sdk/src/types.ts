export type SonarOptions = {
  apiKey: string
  environment: string
  release?: string
  endpoint?: string
}

export type CaptureErrorOptions = {
  fingerprint?: string
  metadata?: Record<string, unknown>
  stack?: string
}

export type RecordDeploymentOptions = {
  version: string
  status?: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'ROLLED_BACK'
  description?: string
  deployedBy?: string
  serviceId?: string
}

export type CaptureErrorPayload = {
  fingerprint: string
  message: string
  serviceId?: string
  stack?: string
  release?: string
  metadata?: Record<string, unknown>
}

export type AuthResponse = {
  token: string
}

export type IngestResponse = {
  id: string
}
