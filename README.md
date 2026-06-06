# Sonar

Observability platform for developers. Uptime monitoring, SDK-based error and web analytics, alert routing, incident management, and status pages.

## Architecture

Monorepo with three packages:

- **`client/`** — React frontend (Vite, Tailwind CSS). Product dashboard, public status pages, and the testing hub for SDK integration.
- **`server/`** — NestJS GraphQL API (Apollo, Prisma, MongoDB). Ingests analytics and uptime check data, runs incident lifecycle, routes alerts, and serves the dashboard frontend.
- **`packages/sdk/`** — `@sonar/sdk` (TypeScript, conditional browser exports). First-party SDK shipped into client apps. Covers error capture, deploy tracking, uptime monitoring, web analytics with frustration detection and smart screenshots, and cookie consent.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, TypeScript, TanStack Query, GSAP |
| Backend | NestJS, Apollo Server, Express, Prisma, MongoDB |
| Auth | Google OAuth, email/password (bcrypt), JSON Web Tokens |
| Storage | Cloudinary (screenshots and replay media) |
| SDK | TypeScript, conditional browser entry point, html2canvas (peer dependency) |

## Prerequisites

- Node.js >= 20
- MongoDB (local or Atlas)
- Cloudinary account (for screenshot storage)
- Google OAuth credentials (optional, for social login)

## Getting Started

```bash
# Install dependencies (root, client, server)
npm run install:all

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, Google OAuth keys, and Cloudinary credentials

# Push Prisma schema to MongoDB
npm --prefix server run db:push

# Start both client and server in dev mode
npm run dev
```

- Client: `http://localhost:3000`
- Server: `http://localhost:8080`
- GraphQL playground: `http://localhost:8080/graphql`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string |
| `WATCHDOG_APP_URL` | Frontend URL (for CORS and links) |
| `WATCHDOG_API_URL` | GraphQL endpoint used by the client |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `JWT_SECRET` | Token signing secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SLACK_BOT_TOKEN` | Slack bot token for alert channels |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email transport |

See `.env.example` for the full list.

## Project Structure

```
.
├── client/              # React dashboard and public pages
│   ├── src/
│   │   ├── pages/       # Route-level page components
│   │   ├── lib/         # API client, GraphQL queries, types
│   │   └── hooks/       # Shared React hooks
│   └── prerender.mjs    # Static prerendering script
├── server/              # NestJS backend
│   ├── prisma/          # Schema and migrations
│   ├── src/
│   │   ├── analytics/   # Web analytics ingest, scoring, session management
│   │   ├── monitors/    # Uptime check scheduling and execution
│   │   ├── incidents/   # Incident creation and timeline
│   │   ├── alerts/      # Alert rules and channel dispatch
│   │   ├── cloudinary/  # Image and video upload service
│   │   └── status-pages/# Public status page management
│   └── test/
├── packages/sdk/        # @sonar/sdk
│   └── src/browser/     # Browser-specific modules (analytics, frustration, screenshots, consent)
└── testing-hub/         # HTML page for SDK integration testing
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start client and server concurrently |
| `npm run build` | Build client and server for production |
| `npm run lint` | Lint both client and server |
| `npm run test` | Run server test suite |
| `npm --prefix server run db:studio` | Open Prisma Studio |

SDK-specific:

| Script | Description |
|--------|-------------|
| `npm --prefix packages/sdk run build` | Compile main and browser entry points |
| `npm --prefix packages/sdk run typecheck` | TypeScript check without emitting |

## Key Features

- **Uptime monitoring** — configurable check intervals, multi-region, state tracking per monitor
- **SDK-based error capture** — client-side error boundary with grouped event deduplication
- **Web analytics** — page views, sessions, referrers, device/OS breakdown
- **Frustration detection** — rage clicks, dead clicks, hover hesitation, scroll chaos, with severity scoring
- **Smart screenshots** — viewport captures with adaptive quality, priority queue, sent on frustration signals and errors
- **Session recording** — mouse position, scroll, click, and resize events with velocity-based adaptive sampling
- **Incident management** — creation, timeline updates, ownership, severity levels
- **Alert routing** — email, Slack, and webhook channels with rule-based triggers
- **Status pages** — public pages with real-time service state, per-page service selection
- **Cookie consent** — built-in GDPR consent banner in the SDK with opt-in tracking

## License

Private. Unlicensed.
