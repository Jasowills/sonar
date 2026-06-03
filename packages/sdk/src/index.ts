import type { IncomingMessage, ServerResponse } from 'node:http'
import { WatchdogClient } from './client'
import type {
  WatchdogOptions,
  CaptureErrorOptions,
  RecordDeploymentOptions,
} from './types'

type NextFunction = (err?: unknown) => void

export class Watchdog {
  private client: WatchdogClient
  private release?: string

  constructor(options: WatchdogOptions) {
    this.client = new WatchdogClient(options)
    this.release = options.release
  }

  setToken(token: string) {
    this.client.setToken(token)
  }

  async authenticate(email: string, password: string): Promise<string> {
    return this.client.authenticate(email, password)
  }

  captureError(error: Error, options?: CaptureErrorOptions) {
    const fingerprint =
      options?.fingerprint ??
      `${error.constructor.name}: ${error.message}`

    const payload = {
      fingerprint,
      title: error.message,
      stack: options?.stack ?? error.stack,
      release: this.release,
      metadata: options?.metadata,
    }

    this.client.ingestError(payload).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[Watchdog] ${msg}`)
    })
  }

  async recordDeployment(options: RecordDeploymentOptions) {
    await this.client.recordDeployment(options)
  }

  setupGlobalHandlers() {
    if (typeof process !== 'undefined' && typeof process.on === 'function') {
      process.on('uncaughtException', (error: Error) => {
        this.captureError(error, { fingerprint: 'UncaughtException' })
      })
      process.on('unhandledRejection', (reason: unknown) => {
        const error =
          reason instanceof Error
            ? reason
            : new Error(String(reason))
        this.captureError(error, { fingerprint: 'UnhandledRejection' })
      })
    }
  }

  middleware() {
    return (
      err: Error,
      _req: IncomingMessage,
      _res: ServerResponse,
      next: NextFunction,
    ) => {
      this.captureError(err)
      next(err)
    }
  }
}
