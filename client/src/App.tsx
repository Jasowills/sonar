import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AppShell } from '@/components/app-shell'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { EventProvider } from '@/lib/event-source'
import { ToastProvider } from '@/lib/toast-store'
import { AlertsPage } from '@/pages/alerts-page'
import { AnalyticsPage } from '@/pages/analytics-page'
import { AnalyticsSessionsPage } from '@/pages/analytics-sessions-page'
import { AnalyticsSessionDetailPage } from '@/pages/analytics-session-detail-page'
import { AuthCallbackPage } from '@/pages/auth-callback-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { DeploymentsPage } from '@/pages/deployments-page'
import { DocsPage } from '@/pages/docs-page'
import { EnvironmentsPage } from '@/pages/environments-page'
import { ErrorsPage } from '@/pages/errors-page'
import { IncidentDetailPage } from '@/pages/incident-detail-page'
import { IncidentsPage } from '@/pages/incidents-page'
import { LoginPage } from '@/pages/login-page'
import { MonitorsPage } from '@/pages/monitors-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { PrivacyPage } from '@/pages/privacy-page'
import { PublicStatusPage } from '@/pages/public-status-page'
import { ServicesPage } from '@/pages/services-page'
import { SettingsPage } from '@/pages/settings-page'
import { StatusPageDetailPage } from '@/pages/status-page-detail-page'
import { StatusPagesPage } from '@/pages/status-pages-page'
import { TeamPage } from '@/pages/team-page'
import { TermsPage } from '@/pages/terms-page'
import { SEO } from '@/lib/seo'
import { useTheme } from '@/hooks/use-theme'

const LandingPage = lazy(() =>
  import('@/pages/landing/landing-page').then((module) => ({
    default: module.LandingPage,
  })),
)

const pageMeta: Record<string, { title: string; eyebrow: string; description: string }> = {
  '/app/dashboard': {
    title: 'Dashboard',
    eyebrow: 'Workspace',
    description: 'Uptime, monitors, and recent activity at a glance.',
  },
  '/app/monitors': {
    title: 'Monitors',
    eyebrow: 'Checks',
    description: 'HTTP checks grouped by service and environment.',
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
        fallback={<div className="min-h-dvh bg-[var(--surface-page)]" />}
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
    if (!statusParams) {
      return (
        <Routes>
          <Route path="/status/:workspaceSlug/:slug" element={<PublicStatusPage />} />
        </Routes>
      )
    }
    return (
      <Routes>
        <Route path="/status/:workspaceSlug/:slug" element={<PublicStatusPage />} />
      </Routes>
    )
  }

  if (isPublicMarketingRoute) {
    return (
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
      <Routes>
        <Route path="/app/dashboard" element={<DashboardPage />} />
        <Route path="/app/monitors" element={<MonitorsPage />} />
        <Route path="/app/analytics" element={<AnalyticsPage />} />
        <Route path="/app/analytics/sessions" element={<AnalyticsSessionsPage />} />
        <Route path="/app/analytics/sessions/:id" element={<AnalyticsSessionsPage />} />
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
