import { type Request, type Response, Router } from 'express'

export type ActivityEntry = {
  id: string
  label: string
  detail: string
  ts: number
  ok: boolean
  category: 'error' | 'analytics' | 'deployment' | 'frustration' | 'system'
}

const MAX_ENTRIES = 100
const activityLog: ActivityEntry[] = []

export function pushActivity(entry: Omit<ActivityEntry, 'id' | 'ts'>) {
  activityLog.unshift({
    ...entry,
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
  })
  if (activityLog.length > MAX_ENTRIES) {
    activityLog.length = MAX_ENTRIES
  }
}

export const activityRouter = Router()

activityRouter.get('/activity', (_req: Request, res: Response) => {
  res.json({ events: activityLog })
})

activityRouter.get('/activity/stats', (_req: Request, res: Response) => {
  const counts = { error: 0, analytics: 0, deployment: 0, frustration: 0, system: 0 }
  for (const e of activityLog) {
    counts[e.category]++
  }
  res.json({ total: activityLog.length, counts })
})

activityRouter.delete('/activity', (_req: Request, res: Response) => {
  activityLog.length = 0
  res.json({ ok: true, cleared: true })
})
