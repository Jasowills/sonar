import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { LogoMark } from '@/components/logo'

export function MarketingLayout({
  children,
  showGrain = true,
}: {
  children: ReactNode
  showGrain?: boolean
}) {
  const { state } = useAuth()
  const isAuthenticated = state.status === 'authenticated'

  return (
    <div className="dark relative min-h-dvh overflow-clip bg-[var(--surface-page)] font-[var(--font-sans)] text-[var(--text-main)] antialiased">
      {showGrain && <div className="landing-grain" aria-hidden />}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border-soft)] bg-[color-mix(in_oklch,var(--surface-page)_80%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-main)]">
              Sonar
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/app/overview"
                className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
              >
                Open dashboard
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-dvh pt-16">{children}</main>

      <footer className="border-t border-[var(--border-soft)] px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-7 w-7" />
              <span className="text-sm font-semibold text-[var(--text-main)]">
                Sonar
              </span>
            </div>
            <p className="max-w-xs text-xs leading-6 text-[var(--text-muted)]">
              Observability for developers. Uptime checks, error tracing,
              alert routing, incident timelines, and status pages — on one quiet
              operational surface.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Product
            </p>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
              <Link
                to="/#features"
                className="transition-colors hover:text-[var(--text-main)]"
              >
                Features
              </Link>
              <Link
                to="/#how"
                className="transition-colors hover:text-[var(--text-main)]"
              >
                How it works
              </Link>
              <Link
                to="/#deploys"
                className="transition-colors hover:text-[var(--text-main)]"
              >
                Deploy correlation
              </Link>
              <Link
                to="/app/overview"
                className="transition-colors hover:text-[var(--text-main)]"
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Company
            </p>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
              <Link
                to="/privacy"
                className="transition-colors hover:text-[var(--text-main)]"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="transition-colors hover:text-[var(--text-main)]"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Get started
            </p>
            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  to="/app/overview"
                  className="group inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                >
                  Open dashboard
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                >
                  Get started
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
              <Link
                to={isAuthenticated ? '/app/overview' : '/login'}
                className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
              >
                {isAuthenticated ? 'Dashboard' : 'Sign in'}
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-6xl border-t border-[var(--border-soft)] pt-8 text-center text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} Sonar. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
