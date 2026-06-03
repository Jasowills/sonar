import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    subs: ['Node.js', 'Python', 'Go', 'Ruby'],
  },
  {
    id: 'api',
    label: 'API reference',
    icon: Terminal,
    subs: ['Error ingestion', 'Deployments', 'Monitors', 'GraphQL'],
  },
  {
    id: 'guides',
    label: 'Guides',
    icon: BookOpen,
    subs: ['Alert routing', 'Error grouping', 'Deploy correlation', 'Status pages'],
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
    body: 'Watchdog is an observability platform designed for small SaaS teams. It unifies uptime monitoring, error tracing, alert routing, incident response, and status pages on a single surface. This documentation covers the Watchdog SDK, REST APIs, GraphQL queries, and best practices for integrating your services.',
    sections: [
      {
        heading: 'What is Watchdog?',
        text: 'Watchdog provides a single operational surface for monitoring production services. It combines HTTP health checks, error ingestion from first-party SDKs, deploy tracking, incident timelines, alert routing, and public status pages — all scoped per workspace, project, service, and environment.',
      },
      {
        heading: 'Key concepts',
        text: 'Workspaces organize your team. Projects group related services. Environments (production, staging, sandbox) keep data separate. Services are the actual applications you monitor. Monitors run HTTP checks. Errors are ingested via SDK and grouped by fingerprint. Deployments correlate releases with incidents.',
      },
      {
        heading: 'Architecture',
        text: 'Watchdog exposes a GraphQL API for dashboard queries and REST endpoints for error and deployment ingestion. The server uses NestJS with Prisma and MongoDB. The client is a React SPA with the dashboard behind authentication and public pages (landing, docs, privacy, terms) open to all.',
      },
    ],
  },
  'getting-started': {
    title: 'Getting started',
    body: 'Get your first monitor running in under five minutes. All you need is a running HTTP endpoint and a Watchdog account.',
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
        text: 'Monitors run HTTP checks against your endpoints. Configure the URL, HTTP method, expected status code, check interval, and timeout. Watchdog will start checking immediately and report the state on the dashboard.',
      },
    ],
  },
  'getting-started-quickstart': {
    title: 'Quickstart',
    body: 'A five-minute walkthrough to get your first monitor online and your first error ingested.',
    code: `# 1. Sign in at https://watchdog.dev/app/overview
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
#    npm install @watchdog/sdk`,
    sections: [
      {
        heading: 'Verify it works',
        text: 'After creating the monitor, check the dashboard — the monitor should show as healthy (green) or degraded (yellow) within one check interval. If it shows down (gray), verify the endpoint is reachable.',
      },
    ],
  },
  'getting-started-installation': {
    title: 'Installation',
    body: 'Install the Watchdog SDK in your application to automatically capture errors and track deployments.',
    code: `# Node.js / TypeScript
npm install @watchdog/sdk
# or
yarn add @watchdog/sdk
# or
pnpm add @watchdog/sdk

# Python
pip install watchdog-sdk

# Go
go get github.com/watchdog/sdk-go

# Ruby
gem install watchdog-sdk`,
    sections: [
      {
        heading: 'Requirements',
        text: 'Node.js 18+ for the JavaScript SDK, Python 3.9+ for the Python SDK, Go 1.21+ for the Go SDK, Ruby 3.0+ for the Ruby SDK. All SDKs require a project key from the Watchdog dashboard.',
      },
    ],
  },
  'getting-started-configuration': {
    title: 'Configuration',
    body: 'Configure the SDK with your project credentials and environment settings.',
    code: `// Environment variables
WATCHDOG_PROJECT_KEY=proj_xxx
WATCHDOG_ENVIRONMENT=production
WATCHDOG_RELEASE=v1.2.3

// Or pass inline (Node.js example)
import Watchdog from '@watchdog/sdk'

const wd = new Watchdog({
  projectKey: process.env.WATCHDOG_PROJECT_KEY,
  environment: process.env.WATCHDOG_ENVIRONMENT || 'development',
  release: process.env.WATCHDOG_RELEASE,
  // Optional: attach user context automatically
  captureUser: true,
})`,
    sections: [
      {
        heading: 'Environment detection',
        text: 'The SDK automatically reads NODE_ENV, ENV, or RAILS_ENV if no environment is explicitly provided. Set WATCHDOG_ENVIRONMENT explicitly for production deployments to ensure errors are tagged correctly.',
      },
    ],
  },
  sdk: {
    title: 'SDK reference',
    body: 'The Watchdog SDK is available for Node.js, Python, Go, and Ruby. Each SDK follows the same patterns — initialize with a project key, then capture errors and track releases with minimal boilerplate.',
  },
  'sdk-node.js': {
    title: 'Node.js SDK',
    body: 'The Node.js SDK captures uncaught exceptions, unhandled promise rejections, and provides a manual capture API. It integrates with Express, Next.js, and other frameworks.',
    code: `import Watchdog from '@watchdog/sdk'

const wd = new Watchdog({
  projectKey: process.env.WATCHDOG_PROJECT_KEY,
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
    code: `from watchdog_sdk import Watchdog

wd = Watchdog(
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
    code: `import "github.com/watchdog/sdk-go"

wd := watchdog.New(watchdog.Config{
    ProjectKey:  "proj_xxx",
    Environment: "production",
})

// Capture panics
defer wd.Recover()

// Manual capture
err := processOrder(data)
if err != nil {
    wd.CaptureError(err, watchdog.Metadata{
        "fingerprint": "OrderProcessingError",
        "orderId":     data.ID,
    })
}

// Track deployment
wd.RecordDeployment(watchdog.Deployment{
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
    code: `require 'watchdog/sdk'

wd = Watchdog::SDK.new(
  project_key: 'proj_xxx',
  environment: 'production',
)

# Rack middleware (Rails / Sinatra)
config.middleware.use Watchdog::Middleware

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
        text: 'Add gem "watchdog-sdk" to your Gemfile and run bundle install. The Railtie automatically configures middleware and captures unhandled exceptions in all environments.',
      },
    ],
  },
  api: {
    title: 'API reference',
    body: 'Watchdog exposes REST endpoints for high-throughput error and deployment ingestion, and a GraphQL endpoint for dashboard queries. Ingest endpoints require an API key (Bearer token). GraphQL queries require a JWT (issued at login).',
  },
  'api-error-ingestion': {
    title: 'Error ingestion',
    body: 'Send errors to Watchdog via the REST API. Each error is identified by a fingerprint — a stable identifier that groups similar errors together. When an error with the same fingerprint is sent repeatedly, Watchdog increments the occurrence count and updates the last-seen timestamp.',
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
        text: 'If you do not provide a fingerprint, Watchdog generates one from the error name, message, and top stack frame. You can override this to group errors by business logic categories.',
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
        text: 'Call the endpoint at the end of your CI pipeline. Use WATCHDOG_TOKEN as an environment variable in your CI secrets. The deployedBy field can be set to the CI provider name (e.g., "GitHub Actions", "CircleCI").',
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
        text: 'Each check executes an HTTP request from Watchdog servers. A response within the timeout with the expected status code (and keyword, if configured) marks the check as healthy. Timeouts, wrong status codes, or missing keywords mark it as degraded or down.',
      },
    ],
  },
  'api-graphql': {
    title: 'GraphQL API',
    body: 'Every dashboard view is backed by a single GraphQL endpoint at /graphql. Authenticate with the same Bearer token. The schema is fully introspectable and includes queries, mutations, and subscriptions.',
    code: `# Full dashboard snapshot
query Overview($workspaceSlug: String) {
  overviewSnapshot(workspaceSlug: "my-workspace") {
    workspaceName
    projectName
    productionMonitorCount
    monitors {
      name targetUrl latestState latestLatencyMs
    }
    metrics { label value detail }
  }
}

# List error groups
query Errors($projectSlug: String, $limit: Int) {
  errorGroups(projectSlug: $projectSlug, limit: 20) {
    id fingerprint title status occurrenceCount
    environmentName serviceName firstSeenAt lastSeenAt
  }
}

# Deployments with environment details
query Deployments($projectSlug: String, $limit: Int) {
  deployments(projectSlug: $projectSlug, limit: 10) {
    version status description deployedBy deployedAt
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
    body: 'Watchdog groups errors by fingerprint — a deterministic hash of the error class, message, and stack trace. You can override the fingerprint to customize grouping behavior for your domain.',
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
  'guides-deploy-correlation': {
    title: 'Deploy correlation',
    body: 'Every release appears on the same timeline as your incidents and latency data. When a deploy precedes an incident, Watchdog surfaces the correlation so you can quickly identify whether a rollout caused the issue.',
    code: [
      '# CI pipeline integration (GitHub Actions example)',
      '- name: Record deployment',
      '  run: |',
      '    curl -X POST https://api.watchdog.dev/ingest/deployments \\',
      '      -H "Authorization: Bearer ${WATCHDOG_TOKEN}" \\',
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
        text: 'If a deploy causes issues, mark it as ROLLED_BACK. Watchdog will highlight it on the incident timeline and exclude it from uptime calculations for the rolled-back version.',
      },
    ],
  },
  'guides-status-pages': {
    title: 'Status pages',
    body: 'Create public status pages to communicate real-time service health with your users. Each status page maps to a unique slug and can display the state of selected services. Status pages inherit the same monochrome visual language as the dashboard.',
    code: `# Create a status page
mutation CreateStatusPage {
  createStatusPage(input: {
    name: "API Status"
    slug: "api-status"
    visibility: "PUBLIC"
    workspaceId: "ws_xxx"
  }) { id name slug }
}

# Link services to the status page
mutation LinkService {
  createStatusPageService(input: {
    statusPageId: "sp_xxx"
    serviceId: "svc_xxx"
    displayName: "Public API"
  }) { id displayName }
}`,
    sections: [
      {
        heading: 'Visibility modes',
        text: 'PUBLIC pages are accessible without authentication at https://your-slug.watchdog.dev. PRIVATE pages require a shared token. Use private pages for internal stakeholder communication during incidents.',
      },
    ],
  },
  examples: {
    title: 'Examples',
    body: 'Ready-to-use integration examples for popular frameworks and tools. Each example shows error capture, deployment tracking, and configuration best practices.',
  },
  'examples-express.js': {
    title: 'Express.js',
    body: 'Integrate Watchdog with an Express.js application. The middleware captures request-scoped errors and attaches route context automatically.',
    code: `import express from 'express'
import Watchdog from '@watchdog/sdk'

const app = express()
const wd = new Watchdog({
  projectKey: process.env.WATCHDOG_PROJECT_KEY,
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
    body: 'Integrate Watchdog with Next.js App Router. The SDK captures server-side errors and supports both API routes and server components.',
    code: `// app/api/watchdog/route.ts
import Watchdog from '@watchdog/sdk'

const wd = new Watchdog({
  projectKey: process.env.WATCHDOG_PROJECT_KEY!,
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
    fetch('/api/watchdog/ingest', {
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
    body: 'Integrate Watchdog with FastAPI using ASGI middleware. Errors are automatically captured with request context.',
    code: `from fastapi import FastAPI, Request
from watchdog_sdk import Watchdog
from watchdog_sdk.integrations.fastapi import WatchdogMiddleware

app = FastAPI()
wd = Watchdog(
    project_key="proj_xxx",
    environment="production",
)

app.add_middleware(WatchdogMiddleware, client=wd)

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
    body: 'Use curl or any HTTP client to interact with Watchdog APIs directly. Perfect for CI/CD pipelines, monitoring scripts, and quick testing.',
    code: `# Authenticate and get a JWT (for GraphQL queries)
TOKEN=$(curl -s -X POST https://api.watchdog.dev/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "your-password"}' \\
  | jq -r '.token')

# List monitors (GraphQL — uses JWT)
curl -s https://api.watchdog.dev/graphql \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "{ monitors { id name targetUrl latestState } }"}' \\
  | jq '.data.monitors'

# Ingest an error (REST — uses API key from Dashboard → Settings → API Keys)
curl -s -X POST https://api.watchdog.dev/ingest/errors \\
  -H "Authorization: Bearer wdp_xxxx_yyyy" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fingerprint": "CLITest",
    "message": "Manual test error",
    "projectKey": "proj_xxx",
    "environmentKey": "env_xxx"
  }'

# Record a deployment (REST — uses API key)
curl -s -X POST https://api.watchdog.dev/ingest/deployments \\
  -H "Authorization: Bearer wdp_xxxx_yyyy" \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectKey": "proj_xxx",
    "environmentKey": "env_xxx",
    "version": "v1.0.0",
    "status": "SUCCEEDED",
    "deployedBy": "curl"
  }'`,
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
}

const searchIndex: SearchEntry[] = Object.entries(content).map(([key, val]) => {
  const section = sections.find((s) => key === s.id || key.startsWith(`${s.id}-`))
  const sectionId = section?.id ?? key.split('-')[0]
  const subLabel = section && key !== section.id
    ? key.slice(section.id.length + 1).replace(/-/g, ' ')
    : undefined
  return { key, sectionId, subLabel, title: val.title }
})

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')
  const [activeSub, setActiveSub] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [activeSection, activeSub])

  const current = lookupContent(activeSection, activeSub)
  const currentLabel = activeSub
    ?? sections.find((s) => s.id === activeSection)?.label
    ?? ''

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    const results = searchIndex.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        content[entry.key]?.body.toLowerCase().includes(q),
    )
    return results.length > 0 ? results : []
  }, [search])

  const navigateTo = (sectionId: string, subLabel?: string) => {
    setActiveSection(sectionId)
    setActiveSub(subLabel)
    setSearch('')
    setSearchFocused(false)
    setSidebarOpen(false)
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
                Watchdog
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
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search documentation…"
              className="w-full border border-[var(--border-soft)] bg-[var(--surface-panel)] py-2 pl-10 pr-10 text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--border-strong)]"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-xs text-[var(--text-soft)] md:inline">
              /&nbsp;&nbsp;
            </kbd>
          </div>

          {searchFocused && searchResults !== null && (
            <div className="absolute inset-x-5 z-50 mt-1 border border-[var(--border-soft)] bg-[var(--surface-panel)] shadow-lg lg:inset-x-auto lg:w-[calc(100%-4rem)]">
              {searchResults.length > 0 ? (
                searchResults.map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => navigateTo(entry.sectionId, entry.subLabel)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
                  >
                    <ChevronRight className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                    <div>
                      <span>{entry.title}</span>
                      {entry.subLabel && (
                        <span className="ml-2 text-xs text-[var(--text-soft)]">
                          — {sections.find((s) => s.id === entry.sectionId)?.label}
                        </span>
                      )}
                    </div>
                  </button>
                ))
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
          <p>&copy; {new Date().getFullYear()} Watchdog. All rights reserved.</p>
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
