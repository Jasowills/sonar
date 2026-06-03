import { type Request, type Response, Router } from 'express'
import { watchdog } from '../watchdog.js'

export const triggerRouter = Router()

function requireWatchdog(_req: Request, res: Response, next: () => void) {
  if (!watchdog) {
    res.status(400).json({ ok: false, message: 'WATCHDOG_PROJECT_KEY and WATCHDOG_ENVIRONMENT_KEY must be set in .env' })
    return
  }
  next()
}

triggerRouter.use(requireWatchdog)

triggerRouter.post('/error', (_req: Request, res: Response) => {
  try {
    throw new Error('Manual test error from testing-hub')
  } catch (err) {
    watchdog!.captureError(err as Error, {
      fingerprint: 'my-awesome-api:manual-error',
      metadata: { source: 'trigger-route', timestamp: Date.now() },
    })
    res.json({ ok: true, captured: true, message: 'Error captured via SDK' })
  }
})

triggerRouter.post('/errors/batch', async (_req: Request, res: Response) => {
  const errors = [
    { message: 'Batch error A', fingerprint: 'my-awesome-api:batch:A' },
    { message: 'Batch error B', fingerprint: 'my-awesome-api:batch:B' },
    { message: 'Batch error C', fingerprint: 'my-awesome-api:batch:C' },
  ]
  for (const e of errors) {
    watchdog!.captureError(new Error(e.message), {
      fingerprint: e.fingerprint,
    })
    await new Promise((r) => setTimeout(r, 50))
  }
  res.json({ ok: true, captured: errors.length })
})

triggerRouter.post('/errors/with-stack', (_req: Request, res: Response) => {
  function deeplyNested() {
    function inner() {
      throw new Error('Deep stack trace error')
    }
    inner()
  }
  try {
    deeplyNested()
  } catch (err) {
    watchdog!.captureError(err as Error, {
      fingerprint: 'my-awesome-api:deep-stack',
      metadata: { layer: 'deeplyNested' },
    })
    res.json({ ok: true, captured: true })
  }
})

triggerRouter.post('/rejection', async (_req: Request, res: Response) => {
  watchdog!.captureError(new Error('Simulated unhandled rejection'), {
    fingerprint: 'UnhandledRejection',
  })
  res.json({ ok: true, captured: true })
})

triggerRouter.post('/deploy', async (_req: Request, res: Response) => {
  await watchdog!.recordDeployment({
    version: `${Date.now()}`,
    status: 'SUCCEEDED',
    description: 'Deployed from my-awesome-api',
    deployedBy: 'kate',
  })
  res.json({ ok: true, deployed: true })
})

triggerRouter.post('/deploy/fail', async (_req: Request, res: Response) => {
  await watchdog!.recordDeployment({
    version: `${Date.now()}`,
    status: 'FAILED',
    description: 'Rolled back — db migration failed',
    deployedBy: 'kate',
  })
  res.json({ ok: true, deployed: true, status: 'FAILED' })
})
