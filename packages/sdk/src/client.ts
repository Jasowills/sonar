import type { SonarOptions, CaptureErrorPayload, RecordDeploymentOptions, IngestResponse } from './types'

const DEFAULT_ENDPOINT = 'https://sonar-api-xi.vercel.app'

export class SonarClient {
  private environment: string
  private endpoint: string
  private token: string | null = null

  constructor(options: SonarOptions) {
    this.environment = options.environment
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT
    this.token = options.apiKey
  }

  setToken(token: string) {
    this.token = token
  }

  private get authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  async ingestError(payload: CaptureErrorPayload): Promise<IngestResponse> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    try {
      const res = await fetch(`${this.endpoint}/ingest/errors`, {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify({
          ...payload,
          metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
          environmentKey: this.environment,
        }),
        signal: controller.signal,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const hint = res.status === 401
          ? ' — check that SONAR_API_KEY is set and valid'
          : ''
        throw new Error(body?.message ?? `Failed to ingest error (${res.status})${hint}`)
      }
      return res.json() as Promise<IngestResponse>
    } finally {
      clearTimeout(timer)
    }
  }

  async recordDeployment(payload: RecordDeploymentOptions): Promise<IngestResponse> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    try {
      const res = await fetch(`${this.endpoint}/ingest/deployments`, {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify({
          version: payload.version,
          status: payload.status,
          description: payload.description,
          deployedBy: payload.deployedBy,
          serviceId: payload.serviceId,
          environmentKey: this.environment,
        }),
        signal: controller.signal,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const hint = res.status === 401
          ? ' — check that SONAR_API_KEY is set and valid'
          : ''
        throw new Error(body?.message ?? `Failed to record deployment (${res.status})${hint}`)
      }
      return res.json() as Promise<IngestResponse>
    } finally {
      clearTimeout(timer)
    }
  }
}
