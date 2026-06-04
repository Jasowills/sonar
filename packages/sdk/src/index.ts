import type { IncomingMessage, ServerResponse } from 'node:http'
import { SonarClient } from './client'
import type {
  SonarOptions,
  CaptureErrorOptions,
  RecordDeploymentOptions,
} from './types'

type NextFunction = (err?: unknown) => void

export class Sonar {
  private client: SonarClient
  private release?: string

  constructor(options: SonarOptions) {
    this.client = new SonarClient(options)
    this.release = options.release
  }

  setToken(token: string) {
    this.client.setToken(token)
  }

  captureError(error: Error, options?: CaptureErrorOptions) {
    const fingerprint =
      options?.fingerprint ??
      `${error.constructor.name}: ${error.message}`

    const payload = {
      fingerprint,
      message: error.message,
      stack: options?.stack ?? error.stack,
      release: this.release,
      metadata: options?.metadata,
    }

    this.client.ingestError(payload).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[Sonar] ${msg}`)
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

export type { SonarOptions, CaptureErrorOptions, RecordDeploymentOptions }
