import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { sanitizeError } from '@/lib/utils'
import { useAuth, setToken } from '@/hooks/use-auth'
import { MarketingLayout } from '@/components/marketing-layout'

type Mode = 'signin' | 'register' | 'forgot'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/graphql'
const serverOrigin = new URL(apiUrl).origin

export function LoginPage() {
  const { state, signInWithGoogle } = useAuth()

  if (state.status === 'loading') {
    return (
      <MarketingLayout showGrain={false}>
        <div />
      </MarketingLayout>
    )
  }

  if (state.status === 'authenticated') {
    return <Navigate to="/app/overview" replace />
  }

  return (
    <MarketingLayout showGrain={false}>
      <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-5">
        <div className="relative w-full max-w-sm">
          <AuthCard
            signInWithGoogle={signInWithGoogle}
            serverOrigin={serverOrigin}
          />
        </div>
      </div>
    </MarketingLayout>
  )
}

function AuthCard({
  signInWithGoogle,
  serverOrigin,
}: {
  signInWithGoogle: () => void
  serverOrigin: string
}) {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const endpoint =
        mode === 'register' ? `${serverOrigin}/auth/register` : `${serverOrigin}/auth/login`
      const body =
        mode === 'register'
          ? JSON.stringify({ email, password, name: name || undefined })
          : JSON.stringify({ email, password })

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message ?? 'Something went wrong')
      }

      setToken(data.token)
      window.location.href = '/app/overview'
    } catch (err) {
      setError(sanitizeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Simulate password reset — no email infra yet
    await new Promise((r) => setTimeout(r, 800))
    setForgotSent(true)
    setSubmitting(false)
  }

  if (mode === 'forgot') {
    return (
      <div className="border border-[var(--border-soft)] bg-[var(--surface-panel)] px-8 py-14">
        {forgotSent ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)]">
              <span className="text-lg text-[var(--text-main)]">&#10003;</span>
            </div>
            <h1 className="mt-5 text-lg font-semibold tracking-tight text-[var(--text-main)]">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              If an account exists for {email}, we&apos;ve sent a password reset
              link.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setForgotSent(false)
              }}
              className="mt-6 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgot}>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text-main)]">
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="text-xs font-medium text-[var(--text-muted)]"
                >
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs text-[var(--text-muted)]">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-none border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError('')
              }}
              className="mt-4 w-full text-center text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="border border-[var(--border-soft)] bg-[var(--surface-panel)] px-8 py-14">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-none border border-[var(--border-soft)] bg-[var(--surface-elevated)]">
          <span className="text-lg font-bold text-[var(--text-main)]">W</span>
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-[var(--text-main)]">
          {mode === 'register' ? 'Create an account' : 'Sign in to Watchdog'}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {mode === 'register'
            ? 'Enter your details to get started.'
            : 'Use your email or Google account.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="space-y-4">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="name"
                className="text-xs font-medium text-[var(--text-muted)]"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="text-xs font-medium text-[var(--text-muted)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-xs font-medium text-[var(--text-muted)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
              placeholder="At least 8 characters"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-none border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] disabled:opacity-50"
        >
          {submitting
            ? 'Please wait…'
            : mode === 'register'
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>

      {mode === 'signin' && (
        <button
          type="button"
          onClick={() => {
            setMode('forgot')
            setError('')
          }}
          className="mt-3 w-full text-center text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
        >
          Forgot your password?
        </button>
      )}

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-soft)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--surface-panel)] px-2 text-[var(--text-muted)]">
            or continue with
          </span>
        </div>
      </div>

      <button
        onClick={signInWithGoogle}
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-none border border-[var(--border-soft)] bg-[var(--surface-page)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48" aria-hidden>
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        Google
      </button>

      <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
        {mode === 'register' ? (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError('')
              }}
              className="font-medium text-[var(--text-main)] transition-colors hover:text-[var(--text-strong)]"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError('')
              }}
              className="font-medium text-[var(--text-main)] transition-colors hover:text-[var(--text-strong)]"
            >
              Create one
            </button>
          </>
        )}
      </p>
    </div>
  )
}
