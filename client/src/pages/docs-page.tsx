import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Fuse from 'fuse.js'
import {
  ArrowRight,
  Book,
  BookOpen,
  ChevronRight,
  Code,
  Cpu,
  Home,
  Menu,
  Monitor,
  Search,
  Terminal,
  X,
} from 'lucide-react'
import { LogoMark } from '@/components/logo'

type DocPage = {
  title: string
  body: string
  code?: string
  sections?: { heading: string; text: string }[]
}

const sections = [
  { id: 'overview', label: 'Overview', icon: Book },
  {
    id: 'getting-started',
    label: 'Getting started',
    icon: BookOpen,
    subs: ['Quickstart', 'Installation', 'Configuration'],
  },
  {
    id: 'sdk',
    label: 'SDK reference',
    icon: Cpu,
    subs: ['Node.js', 'Web', 'Python', 'Go', 'Ruby'],
  },
  {
    id: 'api',
    label: 'API reference',
    icon: Terminal,
    subs: ['Error ingestion', 'Deployments', 'Analytics', 'Monitors', 'Incidents', 'GraphQL'],
  },
  {
    id: 'guides',
    label: 'Guides',
    icon: BookOpen,
    subs: ['Alert routing', 'Error grouping', 'Deploy correlation', 'Incident response', 'Status pages', 'Web analytics'],
  },
  {
    id: 'examples',
    label: 'Examples',
    icon: Code,
    subs: ['Express.js', 'Next.js', 'FastAPI', 'CLI tools'],
  },
]

const content: Record<string, DocPage> = {
  overview: {
    title: 'Overview',
    body: 'Sonar is an observability platform for developers. It unifies uptime monitoring, error tracing, alert routing, incident response, and status pages on a single surface. This documentation covers the Sonar SDK, REST APIs, GraphQL queries, and best practices for integrating your services.',
    sections: [
      {
        heading: 'What is Sonar?',
        text: 'Sonar provides a single operational surface for monitoring production services. It combines HTTP health checks, error ingestion from first-party SDKs, deploy tracking, incident timelines, alert routing, and public status pages — all scoped per workspace, project, service, and environment.',
      },
      {
        heading: 'Key concepts',
        text: 'Workspaces organize your team. Projects group related services. Environments (production, staging, sandbox) keep data separate. Services are the actual applications you monitor. Monitors run HTTP checks. Errors are ingested via SDK and grouped by fingerprint. Deployments correlate releases with incidents.',
      },
      {
        heading: 'Architecture',
        text: 'Sonar exposes a GraphQL API for dashboard queries and REST endpoints for error and deployment ingestion. The server uses NestJS with Prisma and MongoDB. The client is a React SPA with the dashboard behind authentication and public pages (landing, docs, privacy, terms) open to all.',
      },
    ],
  },
  'getting-started': {
    title: 'Getting started',
    body: 'Get your first monitor running in under five minutes. All you need is a running HTTP endpoint and a Sonar account.',
    sections: [
      {
        heading: '1. Create a workspace and project',
        text: 'After signing in, you will land on the dashboard. Create a workspace if you do not have one, then create a project. Every monitor, service, and environment lives inside a project.',
      },
      {
        heading: '2. Add a service and environment',
        text: 'Services represent your applications (e.g., "public-api", "checkout-web"). Environments model deployment stages (production, staging). Both are created from the dashboard or via API.',
      },
      {
        heading: '3. Create a monitor',
        text: 'Monitors run HTTP checks against your endpoints. Configure the URL, HTTP method, expected status code, check interval, and timeout. Sonar will start checking immediately and report the state on the dashboard.',
      },
    ],
  },
  'getting-started-quickstart': {
    title: 'Quickstart',
    body: 'A five-minute walkthrough to get your first monitor online and your first error ingested.',
    code: `# 1. Sign in at https://sonar.app/app/overview
# 2. Create a workspace → add a project
# 3. Create a service named "api" and an environment "production"
# 4. Create a monitor pointing at your health endpoint:
#    POST /graphql
#    mutation {
#      createMonitor(input: {
#        serviceId: "<service-id>"
#        environmentId: "<env-id>"
#        name: "health-check"
#        targetUrl: "https://api.example.com/health"
#        method: "GET"
#        expectedStatus: 200
#      }) { id name latestState }
#    }
# 5. Install the SDK and send your first error:
#    npm install @sonar/sdk`,
    sections: [
      {
        heading: 'Verify it works',
        text: 'After creating the monitor, check the dashboard — the monitor should show as healthy (green) or degraded (yellow) within one check interval. If it shows down (gray), verify the endpoint is reachable.',
      },
    ],
  },
  'getting-started-installation': {
    title: 'Installation',
    body: 'Install the Sonar SDK in your application to automatically capture errors and track deployments.',
    code: `# Node.js / TypeScript
npm install @sonar/sdk
# or
yarn add @sonar/sdk
# or
pnpm add @sonar/sdk

# Python
pip install sonar-sdk

# Go
go get github.com/sonar/sdk-go

# Ruby
gem install sonar-sdk`,
    sections: [
      {
        heading: 'Requirements',
        text: 'Node.js 18+ for the JavaScript SDK, Python 3.9+ for the Python SDK, Go 1.21+ for the Go SDK, Ruby 3.0+ for the Ruby SDK. All SDKs require a project key from the Sonar dashboard.',
      },
    ],
  },
  'getting-started-configuration': {
    title: 'Configuration',
    body: 'Configure the SDK with your project credentials and environment settings.',
    code: `// Environment variables
SONAR_PROJECT_KEY=proj_xxx
SONAR_ENVIRONMENT=production
SONAR_RELEASE=v1.2.3

// Or pass inline (Node.js example)
import Sonar from '@sonar/sdk'

const wd = new Sonar({
  projectKey: process.env.SONAR_PROJECT_KEY,
  environment: process.env.SONAR_ENVIRONMENT || 'development',
  release: process.env.SONAR_RELEASE,
  // Optional: attach user context automatically
  captureUser: true,
})`,
    sections: [
      {
        heading: 'Environment detection',
        text: 'The SDK automatically reads NODE_ENV, ENV, or RAILS_ENV if no environment is explicitly provided. Set SONAR_ENVIRONMENT explicitly for production deployments to ensure errors are tagged correctly.',
      },
    ],
  },
  sdk: {
    title: 'SDK reference',
    body: 'The Sonar SDK is available for Node.js, Python, Go, and Ruby. Each SDK follows the same patterns — initialize with a project key, then capture errors and track releases with minimal boilerplate.',
  },
  'sdk-node.js': {
    title: 'Node.js SDK',
    body: 'The Node.js SDK captures uncaught exceptions, unhandled promise rejections, and provides a manual capture API. It integrates with Express, Next.js, and other frameworks.',
    code: `import Sonar from '@sonar/sdk'

const wd = new Sonar({
  projectKey: process.env.SONAR_PROJECT_KEY,
  environment: 'production',
})

// Auto-capture uncaught exceptions
wd.setupGlobalHandlers()

// Manual capture
try {
  await processOrder(data)
} catch (err) {
  wd.captureError(err, {
    fingerprint: 'OrderProcessingError',
    metadata: { orderId: data.id },
  })
}

// Track a deployment
await wd.recordDeployment({
  version: 'v1.2.3',
  status: 'succeeded',
})`,
    sections: [
      {
        heading: 'Express middleware',
        text: 'Use the Express middleware to automatically capture request-scoped errors: app.use(wd.middleware()). Errors are tagged with the request path, method, and response status code.',
      },
      {
        heading: 'Rate limiting',
        text: 'The SDK batches errors and flushes every five seconds. In high-throughput environments, you can adjust the flush interval and batch size in the constructor options.',
      },
    ],
  },
  'sdk-python': {
    title: 'Python SDK',
    body: 'The Python SDK supports Django, Flask, FastAPI, and standalone applications. It captures unhandled exceptions and integrates with ASGI/WSGI middleware.',
    code: `from sonar_sdk import Sonar

wd = Sonar(
    project_key="proj_xxx",
    environment="production",
)

# Decorator-based capture
@wd.capture
def process_order(data):
    # If this raises, it is captured automatically
    return handle_order(data)

# Context manager
with wd.capture_errors():
    process_order(data)

# Manual capture
try:
    process_order(data)
except Exception as e:
    wd.capture_error(e, fingerprint="OrderProcessingError")

# Track deployment
wd.record_deployment(version="v1.2.3", status="succeeded")`,
    sections: [
      {
        heading: 'ASGI middleware',
        text: 'For FastAPI and Starlette apps, add wd.middleware to your ASGI app. Request-scoped errors are tagged with the route path, HTTP method, and client IP.',
      },
    ],
  },
  'sdk-go': {
    title: 'Go SDK',
    body: 'The Go SDK captures panics and provides a manual capture API. It integrates with the standard net/http handler and popular frameworks like Gin and Echo.',
    code: `import "github.com/sonar/sdk-go"

wd := sonar.New(sonar.Config{
    ProjectKey:  "proj_xxx",
    Environment: "production",
})

// Capture panics
defer wd.Recover()

// Manual capture
err := processOrder(data)
if err != nil {
    wd.CaptureError(err, sonar.Metadata{
        "fingerprint": "OrderProcessingError",
        "orderId":     data.ID,
    })
}

// Track deployment
wd.RecordDeployment(sonar.Deployment{
    Version: "v1.2.3",
    Status:  "succeeded",
})`,
    sections: [
      {
        heading: 'HTTP middleware',
        text: 'Use wd.Middleware(next http.Handler) to wrap your HTTP handlers. Panics are recovered, and errors are tagged with the request URL and method.',
      },
    ],
  },
  'sdk-ruby': {
    title: 'Ruby SDK',
    body: 'The Ruby SDK integrates with Rails, Sinatra, and Rack applications. It captures exceptions and provides manual capture for background jobs.',
    code: `require 'sonar/sdk'

wd = Sonar::SDK.new(
  project_key: 'proj_xxx',
  environment: 'production',
)

# Rack middleware (Rails / Sinatra)
config.middleware.use Sonar::Middleware

# Manual capture
begin
  process_order(data)
rescue => e
  wd.capture_error(e, fingerprint: 'OrderProcessingError')
end

# Track deployment
wd.record_deployment(version: 'v1.2.3', status: 'succeeded')`,
    sections: [
      {
        heading: 'Rails integration',
        text: 'Add gem "sonar-sdk" to your Gemfile and run bundle install. The Railtie automatically configures middleware and captures unhandled exceptions in all environments.',
      },
    ],
  },
  api: {
    title: 'API reference',
    body: 'Sonar exposes REST endpoints for high-throughput error and deployment ingestion, and a GraphQL endpoint for dashboard queries. Ingest endpoints require an API key (Bearer token). GraphQL queries require a JWT (issued at login).',
  },
  'api-error-ingestion': {
    title: 'Error ingestion',
    body: 'Send errors to Sonar via the REST API. Each error is identified by a fingerprint — a stable identifier that groups similar errors together. When an error with the same fingerprint is sent repeatedly, Sonar increments the occurrence count and updates the last-seen timestamp.',
    code: `POST /ingest/errors
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "fingerprint": "TypeError: Cannot read properties of undefined",
  "message": "TypeError in checkout handler",
  "projectKey": "proj_xxx",
  "environmentKey": "env_xxx",
  "serviceId": "svc_xxx",
  "stack": "TypeError: Cannot read properties of undefined\\n    at processOrder (/app/checkout.js:42:10)\\n    at async Server.handle (/app/server.js:18:5)",
  "release": "v1.2.3",
  "metadata": "{\\"path\\":\\"/checkout\\",\\"method\\":\\"POST\\"}"
}`,
    sections: [
      {
        heading: 'Response',
        text: 'Returns 201 Created with the error group ID on first occurrence. Returns 200 OK with the existing error group ID for duplicate fingerprints. The occurrence count is incremented server-side.',
      },
      {
        heading: 'Fingerprinting strategy',
        text: 'If you do not provide a fingerprint, Sonar generates one from the error name, message, and top stack frame. You can override this to group errors by business logic categories.',
      },
    ],
  },
  'api-deployments': {
    title: 'Deployments',
    body: 'Track releases alongside your incidents and metrics. Each deployment records a version, status, and optional description. Deployments appear on the incident timeline and are correlated with monitor state changes.',
    code: `POST /ingest/deployments
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "projectKey": "proj_xxx",
  "environmentKey": "env_xxx",
  "serviceId": "svc_xxx",
  "version": "v1.2.3",
  "status": "SUCCEEDED",
  "description": "Release candidate 3 - includes checkout optimization",
  "deployedBy": "deploy-bot"
}`,
    sections: [
      {
        heading: 'Status values',
        text: 'Valid statuses are IN_PROGRESS, SUCCEEDED, FAILED, and ROLLED_BACK. A deployment initially created as IN_PROGRESS can be updated later with the final status by sending the same version again.',
      },
      {
        heading: 'CI/CD integration',
        text: 'Call the endpoint at the end of your CI pipeline. Use SONAR_TOKEN as an environment variable in your CI secrets. The deployedBy field can be set to the CI provider name (e.g., "GitHub Actions", "CircleCI").',
      },
    ],
  },
  'api-monitors': {
    title: 'Monitors',
    body: 'Create, list, update, and delete HTTP monitors via the GraphQL API. Each monitor is scoped to a service and environment. Monitors run on a configurable interval and support status-code and keyword assertions.',
    code: `# Create a monitor
mutation CreateMonitor {
  createMonitor(input: {
    serviceId: "svc_xxx"
    environmentId: "env_xxx"
    name: "public-api"
    targetUrl: "https://api.example.com/health"
    method: "GET"
    expectedStatus: 200
    expectedKeyword: "ok"
    intervalSeconds: 30
    timeoutSeconds: 10
  }) { id name targetUrl latestState latestLatencyMs }
}

# List monitors
query GetMonitors($projectSlug: String) {
  monitors(projectSlug: $projectSlug) {
    id name targetUrl latestState latestLatencyMs isActive
  }
}

# Update a monitor
mutation UpdateMonitor {
  updateMonitor(input: {
    id: "mon_xxx"
    isActive: false
    intervalSeconds: 60
  }) { id name isActive intervalSeconds }
}`,
    sections: [
      {
        heading: 'Check lifecycle',
        text: 'Each check executes an HTTP request from Sonar servers. A response within the timeout with the expected status code (and keyword, if configured) marks the check as healthy. Timeouts, wrong status codes, or missing keywords mark it as degraded or down.',
      },
    ],
  },
  'api-incidents': {
    title: 'Incidents',
    body: 'Create, resolve, and manage incidents with a full timeline of status updates. Incidents are auto-created when a monitored endpoint transitions to DOWN, with severity CRITICAL. Each incident can track its progress through identified → monitoring → resolved stages.',
    code: `# Query incidents
query ListIncidents {
  incidents {
    id title summary severity status startedAt resolvedAt
    workspaceId projectId serviceId monitorId
  }
}

# Create an incident
mutation CreateIncident {
  createIncident(input: {
    title: "API Latency Spike"
    severity: "HIGH"
    summary: "p95 response time exceeded 5s"
    workspaceId: "ws_xxx"
    projectId: "proj_xxx"
    serviceId: "svc_xxx"
  }) { id title severity status }
}

# Resolve an incident
mutation ResolveIncident {
  resolveIncident(input: {
    id: "inc_xxx"
    summary: "Rolled back to v1.2.0 — latency returned to baseline"
  }) { id status resolvedAt summary }
}

# Add a timeline update
mutation AddUpdate {
  addIncidentUpdate(input: {
    incidentId: "inc_xxx"
    kind: "identified"
    body: "Root cause identified as a misconfigured connection pool in the payments service."
  }) { id kind body createdAt }
}`,
    sections: [
      {
        heading: 'Incident updates',
        text: 'Each update has a kind field: created (auto-generated when the incident opens), identified (root cause found), monitoring (fix deployed, watching metrics), note (general status), or resolved (incident closed). Updates form a chronological timeline on the incident detail page.',
      },
      {
        heading: 'Auto-creation from monitors',
        text: 'When the checker detects a monitor transition from HEALTHY to DOWN, an incident is auto-created with severity CRITICAL and linked to the monitor via monitorId. If the monitor recovers and later goes down again, a new incident is created only after the previous one has been resolved.',
      },
    ],
  },
  'api-graphql': {
    title: 'GraphQL API',
    body: 'Every dashboard view is backed by a single GraphQL endpoint at /graphql. Authenticate with the same Bearer token. The schema is fully introspectable and includes queries, mutations, and subscriptions.',
    code: `# Full dashboard snapshot
query Overview($workspaceSlug: String) {
  overviewSnapshot(workspaceSlug: "my-workspace") {
    workspaceName projectName productionMonitorCount
    monitors { name targetUrl latestState latestLatencyMs }
    metrics { label value detail }
  }
}

# Incidents with timeline updates
query IncidentsWithUpdates($incidentId: String!) {
  incidents { id title severity status startedAt resolvedAt }
  incidentUpdates(incidentId: $incidentId) {
    id kind body createdAt actorUserId
  }
}

# Status page with live service health
query StatusPage($slug: String!) {
  statusPageBySlug(slug: $slug) {
    id name slug headline visibility
    services { id name displayName status latencyMs sortOrder }
  }
}

# Monitors and error groups
query Monitors($projectSlug: String) {
  monitors(projectSlug: $projectSlug) {
    id name targetUrl latestState latestLatencyMs isActive
  }
  errorGroups(projectSlug: $projectSlug, limit: 20) {
    id fingerprint title status occurrenceCount
    environmentName serviceName
  }
}`,
    sections: [
      {
        heading: 'Authentication',
        text: 'Pass your JWT token as a Bearer token in the Authorization header. Tokens are issued by POST /auth/login or POST /auth/google and expire after 24 hours. Ingest endpoints (POST /ingest/*) use API keys instead — create one from the Dashboard → Settings → API Keys.',
      },
      {
        heading: 'Pagination',
        text: 'List queries support a limit argument. The default is 20 items. Some queries also support offset or cursor-based pagination — check the schema for details.',
      },
    ],
  },
  guides: {
    title: 'Guides',
    body: 'Step-by-step guides for configuring alert routing, understanding error grouping, correlating deploys with incidents, and creating public status pages.',
  },
  'guides-alert-routing': {
    title: 'Alert routing',
    body: 'Configure alert channels (Slack, email, webhook) and define rules that determine when alerts are sent. Each rule specifies a trigger type, severity threshold, and the target channel.',
    code: `# Create an alert channel
mutation CreateChannel {
  createAlertChannel(input: {
    name: "Engineering Slack"
    type: "SLACK"
    destination: "https://hooks.slack.com/services/xxx"
    workspaceId: "ws_xxx"
  }) { id name type }
}

# Create an alert rule
mutation CreateRule {
  createAlertRule(input: {
    name: "Production incidents"
    triggerType: "MONITOR_DOWN"
    minimumSeverity: "SEV2"
    alertChannelId: "ch_xxx"
    workspaceId: "ws_xxx"
  }) { id name triggerType }
}`,
    sections: [
      {
        heading: 'Trigger types',
        text: 'MONITOR_DOWN fires when a monitor enters a down state. MONITOR_DEGRADED fires on latency degradation. ERROR_RATE fires when error group occurrences exceed a threshold in a rolling window.',
      },
    ],
  },
  'guides-error-grouping': {
    title: 'Error grouping',
    body: 'Sonar groups errors by fingerprint — a deterministic hash of the error class, message, and stack trace. You can override the fingerprint to customize grouping behavior for your domain.',
    code: `// Override fingerprint for custom grouping
// Instead of grouping by stack trace, group by business logic

wd.captureError(err, {
  fingerprint: \`PaymentFailure:\${data.paymentProvider}\`,
  metadata: {
    provider: data.paymentProvider,
    amount: data.amount,
    currency: data.currency,
  },
})`,
    sections: [
      {
        heading: 'Default fingerprinting',
        text: 'The default fingerprint is SHA-256 of the concatenation: error.constructor.name + ":" + error.message + ":" + topStackFrame. This groups the same error type at the same call site into one group, even if timestamps or request IDs differ.',
      },
      {
        heading: 'Status transitions',
        text: 'Error groups start as OPEN. You can transition them to RESOLVED (when the underlying issue is fixed) or IGNORED (for known non-issues). Resolved groups are re-opened if new occurrences arrive.',
      },
    ],
  },
  'guides-incident-response': {
    title: 'Incident response',
    body: 'Sonar provides a complete incident lifecycle — auto-creation from monitor failures, a timeline of status updates, and resolution tracking. Every incident can evolve through stages as your team investigates and fixes the issue.',
    code: `# Typical incident response flow:

1. Monitor goes DOWN → Incident auto-created (severity CRITICAL)
2. Team acknowledges → Add "identified" update with root cause
3. Fix deployed → Add "monitoring" update
4. Metrics recovered → Resolve incident with summary

# Add a status update
mutation AddUpdate {
  addIncidentUpdate(input: {
    incidentId: "inc_xxx"
    kind: "monitoring"
    body: "Deployed connection pool fix to all instances. Monitoring p95 latency."
  }) { id kind body createdAt }
}`,
    sections: [
      {
        heading: 'Incident timeline',
        text: 'Each incident starts with an initial "created" entry containing the summary. Team members then add updates with kind: identified (root cause found), monitoring (fix deployed, watching metrics), or note (general progress). Every update is timestamped and displayed chronologically on the incident detail page.',
      },
      {
        heading: 'Resolution',
        text: 'When the issue is resolved, click "Resolve" on the detail page. Optionally add a resolution summary that replaces the incident summary. Resolved incidents are marked green and excluded from the "Open" filter tab. The resolver event is broadcast via SSE to all workspace members.',
      },
      {
        heading: 'Auto-creation',
        text: 'When the checker service detects a monitor transitioning from HEALTHY to DOWN, it creates an incident with severity CRITICAL linked to the monitor. If the same monitor already has an OPEN incident, no duplicate is created — the existing incident remains active until resolved.',
      },
    ],
  },
  'guides-deploy-correlation': {
    title: 'Deploy correlation',
    body: 'Every release appears on the same timeline as your incidents and latency data. When a deploy precedes an incident, Sonar surfaces the correlation so you can quickly identify whether a rollout caused the issue.',
    code: [
      '# CI pipeline integration (GitHub Actions example)',
      '- name: Record deployment',
      '  run: |',
      '    curl -X POST https://api.sonar.app/ingest/deployments \\',
      '      -H "Authorization: Bearer ${SONAR_TOKEN}" \\',
      '      -H "Content-Type: application/json" \\',
      "      -d '{",
      '        "environmentId": "env_xxx",',
      '        "serviceId": "svc_xxx",',
      '        "version": "${GITHUB_SHA}",',
      '        "status": "IN_PROGRESS",',
      '        "description": "Deploy from ${GITHUB_REF}",',
      '        "deployedBy": "GitHub Actions"',
      "      }'",
    ].join('\n'),
    sections: [
      {
        heading: 'Marking rollbacks',
        text: 'If a deploy causes issues, mark it as ROLLED_BACK. Sonar will highlight it on the incident timeline and exclude it from uptime calculations for the rolled-back version.',
      },
    ],
  },
  'guides-status-pages': {
    title: 'Status pages',
    body: 'Create public status pages to communicate real-time service health with your users. Each status page maps to a unique slug, displays live health of linked services, and is available without authentication.',
    code: `# Create a status page
mutation CreateStatusPage {
  createStatusPage(input: {
    name: "API Status"
    headline: "Current status of the Example API"
    workspaceId: "ws_xxx"
  }) { id name slug }
}

# Update name / headline / visibility
mutation UpdatePage {
  updateStatusPage(input: {
    id: "sp_xxx"
    name: "Example API Status"
    visibility: "PUBLIC"
  }) { id name visibility }
}

# Add a service with custom display name
mutation AddService {
  addStatusPageService(input: {
    statusPageId: "sp_xxx"
    serviceId: "svc_xxx"
    displayName: "Payment API"
  })
}

# Remove a service
mutation RemoveService {
  removeStatusPageService(input: {
    statusPageId: "sp_xxx"
    serviceId: "svc_xxx"
  })
}`,
    sections: [
      {
        heading: 'Live service health',
        text: 'Each linked service displays its current status based on the latest monitor check. Status is computed as operational (all monitors healthy), degraded (any monitor DEGRADED), or outage (any monitor DOWN). Latency from the latest check is shown alongside each service.',
      },
      {
        heading: 'Public endpoint',
        text: 'The public page is served at GET /status/:workspaceSlug/:slug and returns JSON. No authentication is required. The JSON response includes page info, an overall status string (operational / partial_outage / major_outage), and per-service health. Use this endpoint to feed external status badges or monitoring tools.',
      },
      {
        heading: 'Service management',
        text: 'From the detail page at /app/status-pages/:id, you can add or remove linked services. Each service gets a display name override and sort order. Only services in the same project as the status page can be linked.',
      },
    ],
  },
  examples: {
    title: 'Examples',
    body: 'Ready-to-use integration examples for popular frameworks and tools. Each example shows error capture, deployment tracking, and configuration best practices.',
  },
  'examples-express.js': {
    title: 'Express.js',
    body: 'Integrate Sonar with an Express.js application. The middleware captures request-scoped errors and attaches route context automatically.',
    code: `import express from 'express'
import Sonar from '@sonar/sdk'

const app = express()
const wd = new Sonar({
  projectKey: process.env.SONAR_PROJECT_KEY,
  environment: 'production',
})

// Global error handler middleware
app.use(wd.middleware())

// Example route with manual capture
app.post('/checkout', async (req, res) => {
  try {
    await processOrder(req.body)
    res.json({ ok: true })
  } catch (err) {
    wd.captureError(err, {
      fingerprint: 'CheckoutError',
      metadata: { body: req.body },
    })
    res.status(500).json({ error: 'Checkout failed' })
  }
})

// Track deployment on startup
await wd.recordDeployment({
  version: process.env.RELEASE_VERSION || 'dev',
  status: 'succeeded',
})

app.listen(3000)`,
  },
  'examples-next.js': {
    title: 'Next.js (App Router)',
    body: 'Integrate Sonar with Next.js App Router. The SDK captures server-side errors and supports both API routes and server components.',
    code: `// app/api/sonar/route.ts
import Sonar from '@sonar/sdk'

const wd = new Sonar({
  projectKey: process.env.SONAR_PROJECT_KEY!,
  environment: process.env.NODE_ENV,
})

// API route with error capture
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await processOrder(body)
    return Response.json(result)
  } catch (err) {
    wd.captureError(err, {
      fingerprint: 'OrderApiError',
      metadata: { url: request.url },
    })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// app/error.tsx — global error boundary
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    fetch('/api/sonar/ingest', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint: error.name,
        title: error.message,
        stack: error.stack,
      }),
    })
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}`,
  },
  'examples-fastapi': {
    title: 'FastAPI',
    body: 'Integrate Sonar with FastAPI using ASGI middleware. Errors are automatically captured with request context.',
    code: `from fastapi import FastAPI, Request
from sonar_sdk import Sonar
from sonar_sdk.integrations.fastapi import SonarMiddleware

app = FastAPI()
wd = Sonar(
    project_key="proj_xxx",
    environment="production",
)

app.add_middleware(SonarMiddleware, client=wd)

@app.post("/checkout")
async def checkout(request: Request):
    try:
        data = await request.json()
        result = await process_order(data)
        return {"ok": True}
    except Exception as e:
        wd.capture_error(
            e,
            fingerprint="CheckoutError",
            metadata={"path": str(request.url)},
        )
        raise

# Track deployment via lifespan
@app.on_event("startup")
async def track_deploy():
    wd.record_deployment(
        version="v1.2.3",
        status="succeeded",
    )`,
  },
  'examples-cli-tools': {
    title: 'CLI tools',
    body: 'Use curl or any HTTP client to interact with Sonar APIs directly. Perfect for CI/CD pipelines, monitoring scripts, and quick testing.',
    code: `# Authenticate and get a JWT (for GraphQL queries)
TOKEN=$(curl -s -X POST https://api.sonar.app/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "your-password"}' \\
  | jq -r '.token')

# List monitors (GraphQL — uses JWT)
curl -s https://api.sonar.app/graphql \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "{ monitors { id name targetUrl latestState } }"}' \\
  | jq '.data.monitors'

# Ingest an error (REST — uses API key from Dashboard → Settings → API Keys)
curl -s -X POST https://api.sonar.app/ingest/errors \\
  -H "Authorization: Bearer wdp_xxxx_yyyy" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fingerprint": "CLITest",
    "message": "Manual test error",
    "environmentKey": "env_xxx"
  }'

# Record a deployment (REST — uses API key)
curl -s -X POST https://api.sonar.app/ingest/deployments \\
  -H "Authorization: Bearer wdp_xxxx_yyyy" \\
  -H "Content-Type: application/json" \\
  -d '{
    "environmentKey": "env_xxx",
    "version": "v1.0.0",
    "status": "SUCCEEDED",
    "deployedBy": "curl"
  }'`,
  },
  'sdk-web': {
    title: 'Web SDK',
    body: 'The Sonar Web SDK captures page views, clicks, scrolls, form submissions, console errors, and session recordings directly from the browser — with GDPR-friendly cookie consent built in.',
    code: `import { SonarWeb } from '@sonar/sdk/browser'

const sonar = new SonarWeb({
  apiKey: 'wdp_xxxx_yyyy',
  endpoint: 'https://api.sonar.app',
  autoTrack: {
    pageViews: true,
    linkClicks: true,
    formSubmissions: true,
    scrollDepth: true,
    consoleErrors: true,
  },
  consent: {
    banner: {
      position: 'bottom',
      text: 'We use analytics to improve your experience.',
    },
  },
})

// Manual tracking
sonar.page('Homepage', { referrer: document.referrer })
sonar.track('trial_started', { plan: 'pro' })
sonar.identify('visitor_123', { role: 'admin' })

// Check consent
if (sonar.getConsent() === 'granted') {
  console.log('Tracking active')
}`,
    sections: [
      {
        heading: 'Installation',
        text: 'The Web SDK is included in the @sonar/sdk package. Use the /browser subpath to import it. In a module-based setup, import { SonarWeb } from "@sonar/sdk/browser". The bundler resolves the browser entry automatically for web projects.',
      },
      {
        heading: 'Auto-tracking',
        text: 'The SDK can automatically track page views (including SPA route changes via pushState/popstate interception), link clicks, form submissions, scroll depth (25/50/75/100%), and console errors. Each feature can be individually enabled or disabled via the autoTrack option.',
      },
      {
        heading: 'Consent management',
        text: 'By default, no tracking starts until the visitor grants consent. The SDK respects the browser Do Not Track and Global Privacy Control signals. A built-in consent banner is shown when consent is pending. Call sonar.setConsent("granted") or sonar.setConsent("denied") programmatically.',
      },
      {
        heading: 'Event types',
        text: 'Standard event types include page_view, click, scroll, form_submit, console_error, and custom. Session recording events (recording_mouse, recording_click, recording_scroll) are batched separately. When video recording is enabled, the SDK captures the viewport at 1 fps via html2canvas + MediaRecorder and uploads the resulting WebM to your Cloudinary bucket for replay. Events are flushed every 5 seconds or when the buffer reaches 50 items.',
      },
    ],
  },
  'api-analytics': {
    title: 'Analytics ingestion',
    body: 'Send analytics events to Sonar from the browser SDK or any HTTP client. Events are batched and ingested via a single REST endpoint. Each event is tagged with a session and visitor ID for session replay analysis.',
    code: `POST /ingest/analytics
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "events": [
    {
      "type": "page_view",
      "url": "https://example.com/pricing",
      "referrer": "https://google.com",
      "viewportWidth": 1440,
      "viewportHeight": 900,
      "sessionId": "ses_xxx",
      "visitorId": "vis_xxx",
      "timestamp": "2026-06-06T12:00:00.000Z"
    }
  ],
  "session": {
    "visitorId": "vis_xxx",
    "startUrl": "https://example.com",
    "referrer": "https://google.com",
    "userAgent": "Mozilla/5.0 ...",
    "pageViews": 1,
    "isBounce": true
  }
}`,
    sections: [
      {
        heading: 'Event types',
        text: 'The type field accepts: page_view, click, scroll, form_submit, screenshot, console_error, and custom. The category field further qualifies the event (auto, manual, error, link, form, scroll).',
      },
      {
        heading: 'Session management',
        text: 'Sessions are identified by sessionId. The optional session object in the request body is upserted — existing sessions are updated with new page view and event counts, while new sessions are created. A session is considered a bounce if it has only one page view and no subsequent events.',
      },
    ],
  },
  'guides-web-analytics': {
    title: 'Web analytics',
    body: 'A step-by-step guide to adding Sonar web analytics to your site, from script tag installation to advanced session recording.',
    sections: [
      {
        heading: 'Script tag installation',
        text: 'For simple websites, add the SDK via a script tag: <script type="module"> import { SonarWeb } from "https://cdn.sonar.app/sdk/latest/index.browser.js". Initialize after the DOM is ready with your API key and configuration.',
      },
      {
        heading: 'Framework integration',
        text: 'For React, Vue, or Angular apps, install @sonar/sdk as a dependency. Import SonarWeb from "@sonar/sdk/browser" and initialize it in your app entry point (e.g., main.tsx or App.tsx). The auto-tracking module will automatically intercept pushState calls for SPA route changes.',
      },
      {
        heading: 'Understanding the dashboard',
        text: 'The Analytics dashboard shows page views over time, unique visitors, bounce rate, average session duration, top pages, and traffic sources. Click through to individual sessions to see the full event timeline with metadata.',
      },
    ],
  },
}

function lookupContent(sectionId: string, subLabel?: string): DocPage | undefined {
  if (subLabel) {
    const key = `${sectionId}-${subLabel.toLowerCase().replace(/\s+/g, '-')}`
    return content[key]
  }
  return content[sectionId]
}

type SearchEntry = {
  key: string
  sectionId: string
  subLabel: string | undefined
  title: string
  body: string
  sections: string
  code: string
}

const searchIndex: SearchEntry[] = Object.entries(content).map(([key, val]) => {
  const section = sections.find((s) => key === s.id || key.startsWith(`${s.id}-`))
  const sectionId = section?.id ?? key.split('-')[0]
  const subLabel = section && key !== section.id
    ? key.slice(section.id.length + 1).replace(/-/g, ' ')
    : undefined
  return {
    key,
    sectionId,
    subLabel,
    title: val.title,
    body: val.body,
    sections: (val.sections ?? []).flatMap((s) => `${s.heading} ${s.text}`).join(' '),
    code: val.code ?? '',
  }
})

const fuse = new Fuse(searchIndex, {
  keys: [
    { name: 'title', weight: 10 },
    { name: 'sections', weight: 5 },
    { name: 'body', weight: 3 },
    { name: 'code', weight: 1 },
  ],
  threshold: 0.4,
  distance: 100,
  minMatchCharLength: 2,
})

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')
  const [activeSub, setActiveSub] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [activeSection, activeSub])

  const current = lookupContent(activeSection, activeSub)

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    return fuse.search(search)
  }, [search])

  const resultsList = searchResults ?? []

  const navigateTo = (sectionId: string, subLabel?: string) => {
    setActiveSection(sectionId)
    setActiveSub(subLabel)
    setSearch('')
    setSearchFocused(false)
    setSelectedIndex(0)
    setSidebarOpen(false)
  }

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(value)
      setSelectedIndex(0)
    }, 150)
  }, [])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!resultsList.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i + 1) % resultsList.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i - 1 + resultsList.length) % resultsList.length)
    } else if (e.key === 'Enter' && resultsList[selectedIndex]) {
      e.preventDefault()
      const entry = resultsList[selectedIndex].item
      navigateTo(entry.sectionId, entry.subLabel)
    } else if (e.key === 'Escape') {
      setSearchFocused(false)
      inputRef.current?.blur()
    }
  }

  function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-[var(--text-main)] text-[var(--surface-page)]">{part}</mark>
        : part,
    )
  }

  function getSnippet(text: string, query: string, maxLen = 120): string {
    if (!query.trim()) return text.slice(0, maxLen)
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text.slice(0, maxLen)
    const start = Math.max(0, idx - 40)
    const end = Math.min(text.length, idx + query.length + 60)
    return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
  }

  return (
    <div className="min-h-dvh bg-[var(--surface-page)] text-[var(--text-main)] antialiased">
      <header className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[color-mix(in_oklch,var(--surface-page)_80%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)] lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <LogoMark className="h-6 w-6" />
              <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-main)]">
                Sonar
              </span>
            </Link>
            <span className="text-xs text-[var(--text-muted)]">/</span>
            <span className="text-xs font-medium text-[var(--text-main)]">Docs</span>
          </div>

          <Link
            to="/app/overview"
            className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-1.5 text-xs font-semibold text-[var(--text-main)] transition-all hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
          >
            Dashboard
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-3 lg:px-8" ref={searchRef}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              type="text"
              onChange={handleSearchChange}
              onFocus={() => { setSearchFocused(true); setSelectedIndex(0) }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search documentation…  (press  /  to focus)"
              className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] py-2 pl-10 pr-10 text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--border-strong)]"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-xs text-[var(--text-soft)] md:inline">
              /&nbsp;&nbsp;
            </kbd>
          </div>

          {searchFocused && search !== '' && (
            <div className="absolute inset-x-5 z-50 mt-1 border border-[var(--border-soft)] bg-[var(--surface-panel)] shadow-lg lg:inset-x-auto lg:w-[calc(100%-4rem)]">
              {resultsList.length > 0 ? (
                resultsList.map(({ item: entry, refIndex }, index) => {
                  const snippet = getSnippet(entry.body, search)
                  const isSelected = index === selectedIndex
                  return (
                    <button
                      key={entry.key}
                      type="button"
                      ref={(el) => {
                        if (isSelected) el?.scrollIntoView({ block: 'nearest' })
                      }}
                      onClick={() => navigateTo(entry.sectionId, entry.subLabel)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-[var(--surface-panel-soft)] text-[var(--text-main)]'
                          : 'text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]'
                      }`}
                    >
                      <ChevronRight className={`mt-0.5 h-3 w-3 shrink-0 ${
                        isSelected ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'
                      }`} />
                      <div className="min-w-0">
                        <div className="font-medium">
                          {highlightMatch(entry.title, search)}
                          {entry.subLabel && (
                            <span className="ml-2 text-xs font-normal text-[var(--text-soft)]">
                              — {sections.find((s) => s.id === entry.sectionId)?.label}
                            </span>
                          )}
                        </div>
                        {snippet && (
                          <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                            {highlightMatch(snippet, search)}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="px-4 py-3 text-sm text-[var(--text-muted)]">
                  No results for &ldquo;{search}&rdquo;.
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl px-5 lg:px-8">
        <aside
          className={`w-56 shrink-0 border-r border-[var(--border-soft)] py-8 pr-6 ${
            sidebarOpen
              ? 'fixed inset-y-14 left-0 z-40 block w-64 bg-[var(--surface-page)] shadow-lg'
              : 'hidden lg:block'
          }`}
        >
          <nav className="space-y-6">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => navigateTo(section.id)}
                    className={`flex w-full items-center gap-2 text-left text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                      isActive && !activeSub
                        ? 'text-[var(--text-main)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    {section.label}
                  </button>
                  {section.subs && (
                    <div className="mt-2 space-y-1 border-l border-[var(--border-soft)] pl-4">
                      {section.subs.map((sub) => {
                        const isSubActive = activeSection === section.id && activeSub === sub
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => navigateTo(section.id, sub)}
                            className={`block w-full py-1 text-left text-sm transition-colors ${
                              isSubActive
                                ? 'border-l-2 border-[var(--text-main)] pl-3 font-medium text-[var(--text-main)]'
                                : 'pl-4 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {sub}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main
          ref={contentRef}
          className="min-w-0 flex-1 overflow-y-auto py-8 pl-0 lg:pl-8"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Link to="/" className="flex hover:text-[var(--text-main)]">
                <Home className="h-3 w-3" />
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span>Docs</span>
              {current && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-[var(--text-main)]">{current.title}</span>
                </>
              )}
            </div>

            {current ? (
              <>
                <h1 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-[var(--text-main)]">
                  {current.title}
                </h1>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{current.body}</p>

                {current.sections && current.sections.length > 0 && (
                  <div className="mt-8 space-y-8">
                    {current.sections.map((section, i) => (
                      <div key={i}>
                        <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text-main)]">
                          {section.heading}
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{section.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {current.code && (
                  <div className="mt-8">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      {activeSub ? `${current.title} — example` : 'Example'}
                    </p>
                    <pre className="overflow-x-auto border border-[var(--border-soft)] bg-[var(--surface-panel)] p-4 text-sm leading-6 text-[var(--text-main)]">
                      <code>{current.code}</code>
                    </pre>
                  </div>
                )}

                <div className="mt-12 flex items-center gap-4 border-t border-[var(--border-soft)] pt-6 text-sm">
                  <Link
                    to="/app/overview"
                    className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] px-4 py-2 text-xs font-semibold text-[var(--text-main)] transition-all hover:border-[var(--border-strong)]"
                  >
                    <Monitor className="h-3 w-3" />
                    Open dashboard
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/login"
                    className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
                  >
                    Sign in
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-[var(--text-muted)]">Page not found.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="border-t border-[var(--border-soft)] px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-[var(--text-muted)] sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Sonar. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-[var(--text-main)]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[var(--text-main)]">
              Terms
            </Link>
            <Link to="/" className="hover:text-[var(--text-main)]">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
