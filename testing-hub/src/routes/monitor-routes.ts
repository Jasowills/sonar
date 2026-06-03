import { type Request, type Response, Router } from 'express'

export const monitorRouter = Router()

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

const START = Date.now()

monitorRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: Date.now() - START })
})

monitorRouter.get('/slow', async (_req: Request, res: Response) => {
  const delay = rand(1000, 4000)
  await new Promise((r) => setTimeout(r, delay))
  res.json({ status: 'ok', delayed: Math.round(delay) })
})

monitorRouter.get('/flaky', (_req: Request, res: Response) => {
  const ok = Math.random() > 0.4
  if (ok) {
    res.json({ status: 'ok' })
  } else {
    res.status(500).json({ status: 'error', message: 'random flaky failure' })
  }
})

monitorRouter.get('/error', (_req: Request, res: Response) => {
  res.status(500).json({ status: 'error', message: 'always fails' })
})

monitorRouter.get('/timeout', async (_req: Request, res: Response) => {
  await new Promise((_) => {})
  res.json({ status: 'never' })
})

monitorRouter.get('/version', (_req: Request, res: Response) => {
  res.json({
    service: 'my-awesome-api',
    version: `0.1.0-${Math.floor((Date.now() - START) / 1000)}s`,
    node: process.version,
    projectKey: process.env.WATCHDOG_PROJECT_KEY ?? '(not set)',
    environmentKey: process.env.WATCHDOG_ENVIRONMENT_KEY ?? '(not set)',
  })
})
