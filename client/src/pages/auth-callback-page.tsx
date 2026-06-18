import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { setToken } from '@/hooks/use-auth'
import { MarketingLayout } from '@/components/marketing-layout'

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      window.location.href = '/login'
      return
    }

    const apiUrl =
      import.meta.env.VITE_API_URL ?? 'http://localhost:8080/graphql'
    const serverOrigin = new URL(apiUrl).origin

    fetch(`${serverOrigin}/auth/google`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri: `${window.location.origin}/auth/callback`,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Auth failed')
        return res.json()
      })
      .then((data) => {
        setToken(data.token)
        window.location.href = '/app/overview'
      })
      .catch(() => {
        window.location.href = '/login'
      })
  }, [searchParams])

  return (
    <MarketingLayout>
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-5">
        <div className="text-center">
          <div
            aria-hidden
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-soft)] border-t-[var(--text-main)]"
          />
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Completing sign-in…
          </p>
        </div>
      </div>
    </MarketingLayout>
  )
}
