import { type Request, type Response, Router } from 'express'

export const statusRouter = Router()

const START = Date.now()

type ServiceStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance'

type Service = {
  id: string
  name: string
  status: ServiceStatus
  uptime: number
  description: string
}

function getServices(): Service[] {
  const uptime = Date.now() - START
  return [
    {
      id: 'svc_health',
      name: 'Health Check',
      status: 'operational',
      uptime,
      description: 'Always returns 200. Baseline healthy endpoint.',
    },
    {
      id: 'svc_slow',
      name: 'Slow Endpoint',
      status: 'operational',
      uptime,
      description: 'Responds after 1-4s. Latency varies.',
    },
    {
      id: 'svc_flaky',
      name: 'Flaky Endpoint',
      status: Math.random() > 0.3 ? 'operational' : 'degraded_performance',
      uptime,
      description: '200 ~60% / 500 ~40%. Intermittent failures.',
    },
    {
      id: 'svc_error',
      name: 'Error Endpoint',
      status: 'major_outage',
      uptime: 0,
      description: 'Always returns 500. Simulated outage.',
    },
    {
      id: 'svc_timeout',
      name: 'Timeout Endpoint',
      status: 'partial_outage',
      uptime: 0,
      description: 'Never responds on purpose. Simulated hang.',
    },
  ]
}

statusRouter.get('/status', (_req: Request, res: Response) => {
  const services = getServices()
  const allOperational = services.every((s) => s.status === 'operational')
  const overall: ServiceStatus = allOperational ? 'operational' : services.some((s) => s.status === 'major_outage')
    ? 'major_outage'
    : 'partial_outage'

  res.json({
    page: {
      name: 'my-awesome-api',
      slug: 'my-awesome-api',
      headline: 'Service status for the testing-hub demo API',
    },
    overall,
    updatedAt: new Date().toISOString(),
    services,
  })
})

statusRouter.get('/status/services', (_req: Request, res: Response) => {
  res.json({ services: getServices() })
})
