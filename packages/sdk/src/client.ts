import type { WatchdogOptions, CaptureErrorPayload, RecordDeploymentOptions, IngestResponse } from './types'

const DEFAULT_ENDPOINT = 'http://localhost:8080'

export class WatchdogClient {
  private projectKey: string
  private environment: string
  private endpoint: string
  private token: string | null = null

  constructor(options: WatchdogOptions) {
    this.projectKey = options.projectKey
    this.environment = options.environment
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT
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

  async authenticate(email: string, password: string): Promise<string> {
    const res = await fetch(`${this.endpoint}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.message ?? `Authentication failed (${res.status})`)
    }
    const data = (await res.json()) as { token: string }
    this.token = data.token
    return data.token
  }

  async ingestError(payload: CaptureErrorPayload): Promise<IngestResponse> {
    const res = await fetch(`${this.endpoint}/ingest/errors`, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify({
        ...payload,
        projectKey: this.projectKey,
        environmentKey: this.environment,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const hint = res.status === 401
        ? ' — check that WATCHDOG_API_KEY is set and valid'
        : ''
      throw new Error(body?.message ?? `Failed to ingest error (${res.status})${hint}`)
    }
    return res.json() as Promise<IngestResponse>
  }

  async recordDeployment(payload: RecordDeploymentOptions): Promise<IngestResponse> {
    const res = await fetch(`${this.endpoint}/ingest/deployments`, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify({
        version: payload.version,
        status: payload.status,
        description: payload.description,
        deployedBy: payload.deployedBy,
        serviceId: payload.serviceId,
        projectKey: this.projectKey,
        environmentKey: this.environment,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const hint = res.status === 401
        ? ' — check that WATCHDOG_API_KEY is set and valid'
        : ''
      throw new Error(body?.message ?? `Failed to record deployment (${res.status})${hint}`)
    }
    return res.json() as Promise<IngestResponse>
  }
}
