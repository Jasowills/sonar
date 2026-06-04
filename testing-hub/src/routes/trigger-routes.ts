import { type Request, type Response, Router } from 'express'
import { sonar } from '../sonar.js'

export const triggerRouter = Router()

function requireSonar(_req: Request, res: Response, next: () => void) {
  if (!sonar) {
    res.status(400).json({ ok: false, message: 'SONAR_API_KEY and SONAR_ENVIRONMENT_KEY must be set in .env' })
    return
  }
  next()
}

triggerRouter.post('/error', requireSonar, (_req: Request, res: Response) => {
  try {
    throw new Error('Manual test error from testing-hub')
  } catch (err) {
    sonar!.captureError(err as Error, {
      fingerprint: 'my-awesome-api:manual-error',
      metadata: { source: 'trigger-route', timestamp: Date.now() },
    })
    res.json({ ok: true, captured: true, message: 'Error captured via SDK' })
  }
})

triggerRouter.post('/errors/batch', requireSonar, async (_req: Request, res: Response) => {
  const errors = [
    { message: 'Batch error A', fingerprint: 'my-awesome-api:batch:A' },
    { message: 'Batch error B', fingerprint: 'my-awesome-api:batch:B' },
    { message: 'Batch error C', fingerprint: 'my-awesome-api:batch:C' },
  ]
  for (const e of errors) {
    sonar!.captureError(new Error(e.message), {
      fingerprint: e.fingerprint,
    })
    await new Promise((r) => setTimeout(r, 50))
  }
  res.json({ ok: true, captured: errors.length })
})

triggerRouter.post('/errors/with-stack', requireSonar, (_req: Request, res: Response) => {
  function deeplyNested() {
    function inner() {
      throw new Error('Deep stack trace error')
    }
    inner()
  }
  try {
    deeplyNested()
  } catch (err) {
    sonar!.captureError(err as Error, {
      fingerprint: 'my-awesome-api:deep-stack',
      metadata: { layer: 'deeplyNested' },
    })
    res.json({ ok: true, captured: true })
  }
})

triggerRouter.post('/rejection', requireSonar, async (_req: Request, res: Response) => {
  sonar!.captureError(new Error('Simulated unhandled rejection'), {
    fingerprint: 'UnhandledRejection',
  })
  res.json({ ok: true, captured: true })
})

triggerRouter.post('/deploy', requireSonar, async (_req: Request, res: Response) => {
  await sonar!.recordDeployment({
    version: `${Date.now()}`,
    status: 'SUCCEEDED',
    description: 'Deployed from my-awesome-api',
    deployedBy: 'kate',
  })
  res.json({ ok: true, deployed: true })
})

triggerRouter.post('/deploy/fail', requireSonar, async (_req: Request, res: Response) => {
  await sonar!.recordDeployment({
    version: `${Date.now()}`,
    status: 'FAILED',
    description: 'Rolled back — db migration failed',
    deployedBy: 'kate',
  })
  res.json({ ok: true, deployed: true, status: 'FAILED' })
})

// ── Status page triggers ──

const ENDPOINT = process.env.SONAR_ENDPOINT ?? 'http://localhost:8080'
const API_KEY = process.env.SONAR_API_KEY

async function gql(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(`${ENDPOINT}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })
  const body = await res.json() as { data?: unknown; errors?: Array<{ message: string }> }
  if (!res.ok || body.errors) {
    throw new Error(body.errors?.[0]?.message ?? `GraphQL error (${res.status})`)
  }
  return body.data
}

triggerRouter.post('/status-page', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || (req.body?.workspaceId as string)
    const name = (req.query.name as string) || (req.body?.name as string)
    const headline = (req.query.headline as string) || (req.body?.headline as string) || null
    if (!workspaceId || !name) {
      res.status(400).json({ ok: false, message: 'workspaceId and name are required (query or body)' })
      return
    }
    const data = await gql(`
      mutation CreateStatusPage($input: CreateStatusPageInput!) {
        createStatusPage(input: $input) { id name slug }
      }
    `, {
      input: { workspaceId, name, headline },
    })
    res.json({ ok: true, statusPage: (data as Record<string, unknown>).createStatusPage })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

triggerRouter.post('/status-page/add-service', async (req: Request, res: Response) => {
  try {
    const statusPageId = (req.query.statusPageId as string) || (req.body?.statusPageId as string)
    const serviceId = (req.query.serviceId as string) || (req.body?.serviceId as string)
    const displayName = (req.query.displayName as string) || (req.body?.displayName as string) || null
    if (!statusPageId || !serviceId) {
      res.status(400).json({ ok: false, message: 'statusPageId and serviceId are required (query or body)' })
      return
    }
    const data = await gql(`
      mutation AddStatusPageService($input: AddStatusPageServiceInput!) {
        addStatusPageService(input: $input)
      }
    `, {
      input: { statusPageId, serviceId, displayName },
    })
    res.json({ ok: true, result: (data as Record<string, unknown>).addStatusPageService })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

triggerRouter.post('/status-page/delete', async (req: Request, res: Response) => {
  try {
    const id = (req.query.id as string) || (req.body?.id as string)
    if (!id) {
      res.status(400).json({ ok: false, message: 'id is required (query or body)' })
      return
    }
    const data = await gql(`
      mutation DeleteStatusPage($id: String!) {
        deleteStatusPage(id: $id)
      }
    `, { id })
    res.json({ ok: true, deleted: (data as Record<string, unknown>).deleteStatusPage })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})
