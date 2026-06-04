import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { monitorRouter } from './routes/monitor-routes.js'
import { statusRouter } from './routes/status-routes.js'
import { triggerRouter } from './routes/trigger-routes.js'
import { sonar, checkSdkStatus } from './sonar.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT ?? '3001', 10)

const app = express()
app.use(express.json())

app.get('/', (_req, res) => {
  const html = readFileSync(join(__dirname, 'public', 'index.html'), 'utf-8')
  res.type('html').send(html)
})

app.get('/api/sdk-status', async (_req, res) => {
  res.json(await checkSdkStatus())
})

app.use('/api', monitorRouter)
app.use('/api', statusRouter)
app.use('/trigger', triggerRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: err.message })
})

app.listen(PORT, async () => {
  console.log(`\n  ── testing-hub ──`)
  console.log(`  web UI         → http://localhost:${PORT}`)
  console.log(`  monitor urls   → http://localhost:${PORT}/api/*`)
  console.log(`  status pages   → http://localhost:${PORT}/api/status*`)
  console.log(`  trigger urls   → http://localhost:${PORT}/trigger/*`)
  const sdk = await checkSdkStatus()
  if (sdk.ok) {
    console.log(`  Sonar SDK   → ${sdk.message}`)
  } else {
    console.log(`  Sonar SDK   → ${sdk.message}`)
  }
  console.log()
})
