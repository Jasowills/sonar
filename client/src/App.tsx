import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AppShell } from '@/components/app-shell'

import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { EventProvider } from '@/lib/event-source'
import { ToastProvider } from '@/lib/toast-store'
import { SEO } from '@/lib/seo'
import { useTheme } from '@/hooks/use-theme'

const LandingPage = lazy(() =>
  import('@/pages/landing/landing-page').then((module) => ({
    default: module.LandingPage,
  })),
)

const LoginPage = lazy(() =>
  import('@/pages/login-page').then((m) => ({ default: m.LoginPage })),
)
const AuthCallbackPage = lazy(() =>
  import('@/pages/auth-callback-page').then((m) => ({ default: m.AuthCallbackPage })),
)
const PrivacyPage = lazy(() =>
  import('@/pages/privacy-page').then((m) => ({ default: m.PrivacyPage })),
)
const TermsPage = lazy(() =>
  import('@/pages/terms-page').then((m) => ({ default: m.TermsPage })),
)
const DocsPage = lazy(() =>
  import('@/pages/docs-page').then((m) => ({ default: m.DocsPage })),
)
const PublicStatusPage = lazy(() =>
  import('@/pages/public-status-page').then((m) => ({ default: m.PublicStatusPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/dashboard-page').then((m) => ({ default: m.DashboardPage })),
)
const MonitorsPage = lazy(() =>
  import('@/pages/monitors-page').then((m) => ({ default: m.MonitorsPage })),
)
const MonitorDetailPage = lazy(() =>
  import('@/pages/monitor-detail-page').then((m) => ({ default: m.MonitorDetailPage })),
)
const AnalyticsPage = lazy(() =>
  import('@/pages/analytics-page').then((m) => ({ default: m.AnalyticsPage })),
)
const AnalyticsSessionsPage = lazy(() =>
  import('@/pages/analytics-sessions-page').then((m) => ({ default: m.AnalyticsSessionsPage })),
)
const AnalyticsSessionDetailPage = lazy(() =>
  import('@/pages/analytics-session-detail-page').then((m) => ({ default: m.AnalyticsSessionDetailPage })),
)
const ErrorsPage = lazy(() =>
  import('@/pages/errors-page').then((m) => ({ default: m.ErrorsPage })),
)
const IncidentsPage = lazy(() =>
  import('@/pages/incidents-page').then((m) => ({ default: m.IncidentsPage })),
)
const IncidentDetailPage = lazy(() =>
  import('@/pages/incident-detail-page').then((m) => ({ default: m.IncidentDetailPage })),
)
const DeploymentsPage = lazy(() =>
  import('@/pages/deployments-page').then((m) => ({ default: m.DeploymentsPage })),
)
const AlertsPage = lazy(() =>
  import('@/pages/alerts-page').then((m) => ({ default: m.AlertsPage })),
)
const ServicesPage = lazy(() =>
  import('@/pages/services-page').then((m) => ({ default: m.ServicesPage })),
)
const EnvironmentsPage = lazy(() =>
  import('@/pages/environments-page').then((m) => ({ default: m.EnvironmentsPage })),
)
const StatusPagesPage = lazy(() =>
  import('@/pages/status-pages-page').then((m) => ({ default: m.StatusPagesPage })),
)
const StatusPageDetailPage = lazy(() =>
  import('@/pages/status-page-detail-page').then((m) => ({ default: m.StatusPageDetailPage })),
)
const TeamPage = lazy(() =>
  import('@/pages/team-page').then((m) => ({ default: m.TeamPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings-page').then((m) => ({ default: m.SettingsPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/not-found-page').then((m) => ({ default: m.NotFoundPage })),
)

const pageMeta: Record<string, { title: string; eyebrow: string; description: string }> = {
  '/app/dashboard': {
    title: 'Dashboard',
    eyebrow: '',
    description: '',
  },
  '/app/monitors': {
    title: 'Monitors',
    eyebrow: 'Checks',
    description: 'HTTP checks grouped by service and environment.',
  },
  '/app/monitors/:id': {
    title: 'Monitor',
    eyebrow: 'Checks',
    description: 'Monitor detail and check history.',
  },
  '/app/errors': {
    title: 'Errors',
    eyebrow: 'Errors',
    description: 'Grouped error events ingested from your services.',
  },
  '/app/analytics': {
    title: 'Analytics',
    eyebrow: 'Monitoring',
    description: 'Page views, sessions, and event data from your web SDK.',
  },
  '/app/analytics/sessions': {
    title: 'Sessions',
    eyebrow: 'Monitoring',
    description: 'Visitor sessions with event timelines.',
  },
  '/app/incidents': {
    title: 'Incidents',
    eyebrow: 'Response',
    description: 'Active and past incidents with timeline updates.',
  },
  '/app/deployments': {
    title: 'Deployments',
    eyebrow: 'Delivery',
    description: 'Deployment timeline across your environments.',
  },
  '/app/integrations': {
    title: 'Integrations',
    eyebrow: 'Alerts',
    description: 'Delivery rules for Slack, email, and webhooks.',
  },
  '/app/services': {
    title: 'Services',
    eyebrow: 'Configuration',
    description: 'Manage the services in your project.',
  },
  '/app/environments': {
    title: 'Environments',
    eyebrow: 'Configuration',
    description: 'Manage environments and their keys.',
  },
  '/app/status-pages': {
    title: 'Status pages',
    eyebrow: 'External',
    description: 'Public status pages for your users.',
  },
  '/app/team': {
    title: 'Team',
    eyebrow: 'Workspace',
    description: 'Workspace members and roles.',
  },
  '/app/settings': {
    title: 'Settings',
    eyebrow: 'Config',
    description: 'Profile, workspace, API keys, and more.',
  },
}

const PUBLIC_ROUTES = ['/', '/login', '/auth/callback', '/privacy', '/terms', '/docs']

function isPublicPath(path: string): boolean {
  if (PUBLIC_ROUTES.includes(path)) return true
  if (path.startsWith('/status/')) return true
  return false
}

function getStatusPathParams(path: string): { workspaceSlug: string; slug: string } | null {
  const match = path.match(/^\/status\/([^/]+)\/([^/]+)/)
  if (match) return { workspaceSlug: match[1], slug: match[2] }
  return null
}

function AppContent() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { state } = useAuth()

  if (state.status === 'loading') {
    return <div className="min-h-dvh bg-[var(--surface-page)]" />
  }

  if (location.pathname === '/') {
    if (state.status === 'authenticated') {
      return <Navigate to="/app/dashboard" replace />
    }
    return (
      <Suspense
        fallback={<div className="flex-1 bg-[var(--surface-page)]" />}
      >
        <SEO
          title="Observability for developers"
          description="Sonar combines uptime monitoring, error tracing, alert routing, incident response, and status pages for developers."
          path="/"
        />
        <LandingPage />
      </Suspense>
    )
  }

  if (
    state.status === 'unauthenticated' &&
    !isPublicPath(location.pathname)
  ) {
    return <Navigate to="/login" replace />
  }

  const isPublicMarketingRoute =
    location.pathname === '/login' ||
    location.pathname === '/auth/callback' ||
    location.pathname === '/privacy' ||
    location.pathname === '/terms' ||
    location.pathname === '/docs'

  if (location.pathname.startsWith('/status/')) {
    const statusParams = getStatusPathParams(location.pathname)
    return (
      <Suspense fallback={<div className="flex-1 bg-[var(--surface-page)]" />}>
        <Routes>
          <Route path="/status/:workspaceSlug/:slug" element={<PublicStatusPage />} />
        </Routes>
      </Suspense>
    )
  }

  if (isPublicMarketingRoute) {
    return (
      <Suspense fallback={<div className="flex-1 bg-[var(--surface-page)]" />}>
      <Routes>
        <Route
          path="/login"
          element={
            <>
              <SEO title="Sign in" path="/login" noindex />
              <LoginPage />
            </>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <>
              <SEO title="Authenticating" path="/auth/callback" noindex />
              <AuthCallbackPage />
            </>
          }
        />
        <Route
          path="/privacy"
          element={
            <>
              <SEO
                title="Privacy Policy"
                description="Sonar privacy policy — how we collect, use, and protect your data."
                path="/privacy"
              />
              <PrivacyPage />
            </>
          }
        />
        <Route
          path="/terms"
          element={
            <>
              <SEO
                title="Terms of Service"
                description="Sonar terms of service — rules and guidelines for using our platform."
                path="/terms"
              />
              <TermsPage />
            </>
          }
        />
        <Route
          path="/docs"
          element={
            <>
              <SEO
                title="Documentation"
                description="Sonar documentation — SDK reference, API guides, and integration tutorials for uptime monitoring and error tracing."
                path="/docs"
              />
              <DocsPage />
            </>
          }
        />
      </Routes>
      </Suspense>
    )
  }

  const currentMeta = pageMeta[location.pathname] ?? {
    title: 'Sonar',
    eyebrow: 'Workspace',
    description: '',
  }

  return (
    <AppShell
      title={currentMeta.title}
      eyebrow={currentMeta.eyebrow}
      description={currentMeta.description}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      <Suspense fallback={<div className="min-h-dvh bg-[var(--surface-page)]" />}>
        <Routes>
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/monitors" element={<MonitorsPage />} />
          <Route path="/app/monitors/:id" element={<MonitorDetailPage />} />
          <Route path="/app/analytics" element={<AnalyticsPage />} />
          <Route path="/app/analytics/sessions" element={<AnalyticsSessionsPage />} />
          <Route path="/app/analytics/sessions/:id" element={<AnalyticsSessionDetailPage />} />
          <Route path="/app/errors" element={<ErrorsPage />} />
          <Route path="/app/incidents" element={<IncidentsPage />} />
          <Route path="/app/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="/app/deployments" element={<DeploymentsPage />} />
          <Route path="/app/integrations" element={<AlertsPage />} />
          <Route path="/app/services" element={<ServicesPage />} />
          <Route path="/app/environments" element={<EnvironmentsPage />} />
          <Route path="/app/status-pages" element={<StatusPagesPage />} />
          <Route path="/app/status-pages/:id" element={<StatusPageDetailPage />} />
          <Route path="/app/team" element={<TeamPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />

          {/* Redirect old paths */}
          <Route path="/app/overview" element={<Navigate replace to="/app/dashboard" />} />
          <Route path="/app/traces" element={<Navigate replace to="/app/errors" />} />
          <Route path="/app/connections" element={<Navigate replace to="/app/services" />} />
          <Route path="/app/alerts" element={<Navigate replace to="/app/integrations" />} />

          <Route path="/app" element={<Navigate replace to="/app/dashboard" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <EventProvider>
          <AppContent />
        </EventProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
