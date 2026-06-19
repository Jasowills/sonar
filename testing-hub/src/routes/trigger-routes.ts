import { type Request, type Response, Router } from 'express'
import { sonar } from '../sonar.js'
import { pushActivity } from './activity.js'

export const triggerRouter = Router()

const ENDPOINT = process.env.SONAR_ENDPOINT ?? 'http://localhost:8080'
const API_KEY = process.env.SONAR_API_KEY
const PROJECT_KEY = process.env.SONAR_PROJECT_KEY

async function ingestAnalytics(body: Record<string, unknown>) {
  const payload = { ...body, projectKey: PROJECT_KEY }
  const res = await fetch(`${ENDPOINT}/ingest/analytics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error')
    throw new Error(`analytics ingest failed (${res.status}): ${text.slice(0, 200)}`)
  }
}

function requireSonar(_req: Request, res: Response, next: () => void) {
  if (!sonar) {
    res.status(400).json({ ok: false, message: 'SONAR_API_KEY and SONAR_ENVIRONMENT_KEY must be set in .env' })
    return
  }
  next()
}

// ── Errors ──

triggerRouter.post('/error', requireSonar, (_req: Request, res: Response) => {
  try {
    throw new Error('Manual test error from testing-hub')
  } catch (err) {
    sonar!.captureError(err as Error, {
      fingerprint: 'my-awesome-api:manual-error',
      metadata: { source: 'trigger-route', timestamp: Date.now() },
    })
    pushActivity({ label: 'Error Captured', detail: 'Manual test error', ok: true, category: 'error' })
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
    sonar!.captureError(new Error(e.message), { fingerprint: e.fingerprint })
    await new Promise((r) => setTimeout(r, 50))
  }
  pushActivity({ label: 'Errors Batch', detail: `Captured ${errors.length} errors`, ok: true, category: 'error' })
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
    pushActivity({ label: 'Error w/ Stack', detail: 'Deep stack trace captured', ok: true, category: 'error' })
    res.json({ ok: true, captured: true })
  }
})

triggerRouter.post('/rejection', requireSonar, async (_req: Request, res: Response) => {
  sonar!.captureError(new Error('Simulated unhandled rejection'), {
    fingerprint: 'UnhandledRejection',
  })
  pushActivity({ label: 'Unhandled Rejection', detail: 'Simulated rejection captured', ok: true, category: 'error' })
  res.json({ ok: true, captured: true })
})

// ── Deployments ──

triggerRouter.post('/deploy', requireSonar, async (_req: Request, res: Response) => {
  await sonar!.recordDeployment({
    version: `${Date.now()}`,
    status: 'SUCCEEDED',
    description: 'Deployed from my-awesome-api',
    deployedBy: 'kate',
  })
  pushActivity({ label: 'Deployment', detail: 'SUCCEEDED', ok: true, category: 'deployment' })
  res.json({ ok: true, deployed: true })
})

triggerRouter.post('/deploy/fail', requireSonar, async (_req: Request, res: Response) => {
  await sonar!.recordDeployment({
    version: `${Date.now()}`,
    status: 'FAILED',
    description: 'Rolled back — db migration failed',
    deployedBy: 'kate',
  })
  pushActivity({ label: 'Deployment', detail: 'FAILED — db migration', ok: true, category: 'deployment' })
  res.json({ ok: true, deployed: true, status: 'FAILED' })
})

// ── Analytics Events (server-side via ingest API) ──

triggerRouter.post('/analytics', async (_req: Request, res: Response) => {
  try {
    const body: Record<string, unknown> = {
      events: [{
        type: 'custom',
        name: 'testing-hub:server_event',
        url: `http://localhost:${process.env.PORT ?? 3001}/trigger/analytics`,
        severity: 0.5,
        payload: JSON.stringify({ source: 'testing-hub', timestamp: Date.now() }),
      }],
    }
    await ingestAnalytics(body)
    pushActivity({ label: 'Analytics Event', detail: 'custom:testing-hub:server_event', ok: true, category: 'analytics' })
    res.json({ ok: true, message: 'Analytics event sent' })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

triggerRouter.post('/analytics/page-view', async (_req: Request, res: Response) => {
  try {
    const body: Record<string, unknown> = {
      events: [{
        type: 'page_view',
        name: 'Server Page View',
        url: `http://localhost:${process.env.PORT ?? 3001}/test-page`,
        referrer: 'https://sonar.dev',
        userAgent: 'testing-hub/1.0',
        viewportWidth: 1440,
        viewportHeight: 900,
        severity: 0.3,
      }],
    }
    await ingestAnalytics(body)
    pushActivity({ label: 'Page View', detail: 'Server Page View', ok: true, category: 'analytics' })
    res.json({ ok: true, message: 'Page view event sent' })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

triggerRouter.post('/analytics/click', async (_req: Request, res: Response) => {
  try {
    const body: Record<string, unknown> = {
      events: [{
        type: 'click',
        name: 'Deploy Button',
        url: `http://localhost:${process.env.PORT ?? 3001}/dashboard`,
        severity: 0.6,
        payload: JSON.stringify({ element: '#deploy-btn', text: 'Deploy Now' }),
      }],
    }
    await ingestAnalytics(body)
    pushActivity({ label: 'Click Event', detail: 'Deploy Button clicked', ok: true, category: 'analytics' })
    res.json({ ok: true, message: 'Click event sent' })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

triggerRouter.post('/analytics/scroll', async (_req: Request, res: Response) => {
  try {
    const body: Record<string, unknown> = {
      events: [{
        type: 'scroll',
        name: 'Pricing Section',
        url: `http://localhost:${process.env.PORT ?? 3001}/pricing`,
        severity: 0.4,
        payload: JSON.stringify({ depth: 75, element: '#pricing' }),
      }],
    }
    await ingestAnalytics(body)
    pushActivity({ label: 'Scroll Event', detail: 'Pricing section 75%', ok: true, category: 'analytics' })
    res.json({ ok: true, message: 'Scroll event sent' })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

triggerRouter.post('/analytics/form-submit', async (_req: Request, res: Response) => {
  try {
    const body: Record<string, unknown> = {
      events: [{
        type: 'form_submit',
        name: 'Waitlist Signup',
        url: `http://localhost:${process.env.PORT ?? 3001}/signup`,
        severity: 0.7,
        payload: JSON.stringify({ formId: 'waitlist-form', fields: ['email', 'name'] }),
      }],
    }
    await ingestAnalytics(body)
    pushActivity({ label: 'Form Submit', detail: 'Waitlist Signup', ok: true, category: 'analytics' })
    res.json({ ok: true, message: 'Form submit event sent' })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

triggerRouter.post('/analytics/console-error', async (_req: Request, res: Response) => {
  try {
    const body: Record<string, unknown> = {
      events: [{
        type: 'console_error',
        name: 'Failed to load resource',
        url: `http://localhost:${process.env.PORT ?? 3001}/app`,
        severity: 0.9,
        payload: JSON.stringify({
          message: 'net::ERR_CONNECTION_REFUSED',
          filename: 'https://cdn.example.com/widget.js',
        }),
      }],
    }
    await ingestAnalytics(body)
    pushActivity({ label: 'Console Error', detail: 'net::ERR_CONNECTION_REFUSED', ok: true, category: 'analytics' })
    res.json({ ok: true, message: 'Console error event sent' })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

// ── Frustration Signals ──

const FRUSTRATION_TYPES: Record<string, { label: string; detail: string }> = {
  'rage-click': { label: 'Rage Click', detail: '5 clicks on #submit-btn in 1.5s' },
  'dead-click': { label: 'Dead Click', detail: 'Click on <button> with no mutation' },
  'hesitation': { label: 'Hesitation', detail: 'Hovered #checkout-btn for 2.3s' },
  'scroll-chaos': { label: 'Scroll Chaos', detail: '4 direction changes in 2s' },
  'cascade': { label: 'Cascade', detail: 'Rage+Dead+Hesitation in 5s window' },
}

triggerRouter.post('/frustration/:kind', async (req: Request, res: Response) => {
  const kind = req.params.kind as string
  const config = FRUSTRATION_TYPES[kind]
  if (!config) {
    res.status(400).json({ ok: false, message: `Unknown frustration kind: ${kind}` })
    return
  }
  try {
    const body: Record<string, unknown> = {
      events: [{
        type: `frustration_${kind.replace('-', '_')}`,
        url: `http://localhost:${process.env.PORT ?? 3001}/test`,
        severity: 0.85,
        payload: JSON.stringify({
          simulated: true,
          source: 'testing-hub',
          timestamp: Date.now(),
        }),
      }],
    }
    await ingestAnalytics(body)
    pushActivity({ label: config.label, detail: config.detail, ok: true, category: 'frustration' })
    res.json({ ok: true, message: `${config.label} event sent` })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

// ── Sessions ──

triggerRouter.post('/session/start', async (_req: Request, res: Response) => {
  try {
    const sessionId = `test_${Date.now().toString(36)}`
    const visitorId = `visitor_${Date.now().toString(36)}`
    const body: Record<string, unknown> = {
      events: [{
        type: 'page_view',
        name: 'Session Start',
        url: `http://localhost:${process.env.PORT ?? 3001}/session-start`,
        visitorId,
        sessionId,
        severity: 0.2,
      }],
      session: {
        visitorId,
        sessionId,
        startUrl: `http://localhost:${process.env.PORT ?? 3001}/session-start`,
        referrer: 'https://sonar.dev',
        userAgent: 'testing-hub/1.0',
        pageViews: 1,
        eventCount: 1,
        isBounce: false,
      },
    }
    await ingestAnalytics(body)
    pushActivity({ label: 'Session Started', detail: `session=${sessionId.slice(0, 12)}…`, ok: true, category: 'analytics' })
    res.json({ ok: true, sessionId, visitorId })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

// ── Status page triggers ──

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
    `, { input: { workspaceId, name, headline } })
    pushActivity({ label: 'Status Page Created', detail: name, ok: true, category: 'system' })
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
      res.status(400).json({ ok: false, message: 'statusPageId and serviceId are required' })
      return
    }
    const data = await gql(`
      mutation AddStatusPageService($input: AddStatusPageServiceInput!) {
        addStatusPageService(input: $input)
      }
    `, { input: { statusPageId, serviceId, displayName } })
    pushActivity({ label: 'Service Added', detail: `to status page ${statusPageId.slice(0, 8)}…`, ok: true, category: 'system' })
    res.json({ ok: true, result: (data as Record<string, unknown>).addStatusPageService })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})

triggerRouter.post('/status-page/delete', async (req: Request, res: Response) => {
  try {
    const id = (req.query.id as string) || (req.body?.id as string)
    if (!id) {
      res.status(400).json({ ok: false, message: 'id is required' })
      return
    }
    const data = await gql(`
      mutation DeleteStatusPage($id: String!) {
        deleteStatusPage(id: $id)
      }
    `, { id })
    pushActivity({ label: 'Status Page Deleted', detail: id.slice(0, 8) + '…', ok: true, category: 'system' })
    res.json({ ok: true, deleted: (data as Record<string, unknown>).deleteStatusPage })
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) })
  }
})
