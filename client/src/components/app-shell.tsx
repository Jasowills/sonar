import { type ReactNode, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, Plus, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { LogoMark } from '@/components/logo'
import { Avatar } from '@/components/avatar'
import { SEO } from '@/lib/seo'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { useEventSource } from '@/lib/event-source'

import { navigationGroups } from '@/data/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useWorkspaces } from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationPanel } from '@/components/notification-panel'
import { ToastContainer } from '@/components/toast-container'
import { FaviconIndicator } from '@/components/favicon-indicator'
import { CommandPalette } from '@/components/command-palette'
import { CreateProjectModal } from '@/features/create/create-project-modal'

type AppShellProps = {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
  children: ReactNode
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function UserMenu() {
  const { state, signOut } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  if (state.status !== 'authenticated') return null

  const user = state.user
  const name = user.name ?? user.email
  const avatar = user.picture

  const handleSignOut = () => {
    setSigningOut(true)
    setTimeout(() => {
      signOut()
    }, 300)
  }

  const openDialog = () => {
    setShowConfirm(true)
    requestAnimationFrame(() => setAnimateIn(true))
  }

  const closeDialog = () => {
    setAnimateIn(false)
    setTimeout(() => setShowConfirm(false), 150)
  }

  return (
    <div className="flex items-center gap-2.5">
      <Avatar src={avatar} name={name} />
      <span className="hidden text-sm font-medium text-[var(--text-main)] md:inline">
        {name}
      </span>
      <button
        onClick={openDialog}
        className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-150"
          style={{ opacity: animateIn ? 1 : 0 }}
          onClick={closeDialog}
        >
          <div
            className="w-80 border border-[var(--border-soft)] bg-[var(--surface-page)] transition-all duration-200"
            style={{
              opacity: animateIn ? 1 : 0,
              transform: animateIn ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.98)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-0.5 w-full bg-[var(--dot-down)]" />

            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--dot-down)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--dot-down)]" />
                </span>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-[var(--dot-down)]">
                  Session
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Avatar src={avatar} name={name} />
                <div>
                  <p className="text-sm font-medium text-[var(--text-main)]">{name}</p>
                  {user.email && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{user.email}</p>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Are you sure you want to sign out of Sonar?
              </p>

              <div className="mt-5 flex items-center justify-end gap-3">
                <Button variant="outline" size="sm" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut && <Spinner />}
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectSelector() {
  const { project, projects, setProject } = useSelectedProject()
  const { data: workspaces } = useWorkspaces()
  const workspaceId = workspaces?.[0]?.id ?? ''
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const showDropdown = open && projects.length >= 1

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-[var(--text-soft)] hover:text-[var(--text-main)]"
      >
        {project?.name ?? 'No project'}
        {(projects.length >= 1 || !project) && <ChevronDown className="h-3 w-3" />}
      </button>
      {showDropdown && (
        <>
          <div className="absolute left-0 top-full z-50 mt-1 w-48 border border-[var(--border-soft)] bg-[var(--surface-page)]">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProject(p.id)
                  setOpen(false)
                }}
                className={cn(
                  'block w-full px-3 py-2 text-left text-sm transition-colors',
                  p.id === project?.id
                    ? 'bg-[var(--surface-panel-soft)] font-medium text-[var(--text-main)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]',
                )}
              >
                {p.name}
              </button>
            ))}
            <div className="border-t border-[var(--border-soft)]">
              <button
                onClick={() => { setOpen(false); setShowCreate(true) }}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Create project
              </button>
            </div>
          </div>
        </>
      )}
      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} workspaceId={workspaceId} />
    </div>
  )
}

export function AppShell({
  title,
  description,
  eyebrow,
  actions,
  children,
  theme,
  onToggleTheme,
}: AppShellProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: workspaces } = useWorkspaces()
  const { project } = useSelectedProject()
  const workspaceName = workspaces?.[0]?.name ?? 'Workspace'
  const queryClient = useQueryClient()
  const { lastEvent } = useEventSource()

  useEffect(() => {
    if (!lastEvent) return
    console.log(`[SSE] AppShell handling type=${lastEvent.type}`, lastEvent.data)
    if (lastEvent.type === 'analytics_ingested') {
      console.log('[SSE] invalidating analytics queries')
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] })
      queryClient.invalidateQueries({ queryKey: ['analyticsPageViews'] })
      queryClient.invalidateQueries({ queryKey: ['analyticsSessions'] })
      queryClient.invalidateQueries({ queryKey: ['analyticsTopPages'] })
      queryClient.invalidateQueries({ queryKey: ['analyticsSources'] })
      queryClient.invalidateQueries({ queryKey: ['analyticsEventTypes'] })
    }
    if (lastEvent.type === 'error_created') {
      console.log('[SSE] invalidating errorGroups + overviewSnapshot')
      queryClient.invalidateQueries({ queryKey: ['errorGroups'] })
      queryClient.invalidateQueries({ queryKey: ['overviewSnapshot'] })
    }
    if (['monitor_down', 'monitor_up', 'monitor_degraded'].includes(lastEvent.type)) {
      console.log('[SSE] invalidating monitors + overviewSnapshot')
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
      queryClient.invalidateQueries({ queryKey: ['overviewSnapshot'] })
    }
    if (lastEvent.type === 'incident_update') {
      console.log('[SSE] invalidating incidentUpdates')
      queryClient.invalidateQueries({ queryKey: ['incidentUpdates'] })
    }
    if (lastEvent.type === 'notification') {
      const nd = lastEvent.data as { type?: string }
      const nt = nd?.type ?? ''
      if (['monitor_down', 'monitor_up', 'monitor_degraded'].includes(nt)) {
        console.log('[SSE] invalidating monitors + overviewSnapshot')
        queryClient.invalidateQueries({ queryKey: ['monitors'] })
        queryClient.invalidateQueries({ queryKey: ['overviewSnapshot'] })
      }
      if (['incident_created', 'incident_resolved'].includes(nt)) {
        console.log('[SSE] invalidating incidents')
        queryClient.invalidateQueries({ queryKey: ['incidents'] })
      }
      if (nt === 'incident_update') {
        console.log('[SSE] invalidating incidentUpdates')
        queryClient.invalidateQueries({ queryKey: ['incidentUpdates'] })
      }
      if (nt === 'deploy_completed') {
        console.log('[SSE] invalidating deployments')
        queryClient.invalidateQueries({ queryKey: ['deployments'] })
      }
    }
  }, [lastEvent, queryClient])

  return (
    <>
      <SEO
        title={title}
        description={description}
        path={location.pathname}
        noindex
      />
      <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-main)]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[var(--surface-page)]">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="flex h-9 w-9 items-center justify-center border border-[var(--border-soft)] text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <LogoMark className="h-6 w-6" />
            <span className="text-base font-semibold tracking-[-0.01em] text-[var(--text-main)] hidden sm:inline">
Sonar
            </span>
            <span className="hidden text-sm text-[var(--text-soft)] sm:inline">
              {workspaceName}
            </span>
            <span className="hidden text-[var(--text-soft)] sm:inline">·</span>
            <ProjectSelector />
          </div>

          <div className="flex items-center gap-3">
            <NotificationPanel />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1440px]">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed bottom-0 left-0 top-14 z-40 w-64 border-r border-[var(--border-soft)] bg-[var(--surface-page)] transition-transform lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <nav className="flex flex-col gap-4 p-4">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <div className="mb-1 px-3 py-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-soft)]">
                    {group.label}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-[var(--surface-panel-soft)] text-[var(--text-main)]'
                            : 'text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main area */}
        <main className="min-w-0 flex-1 bg-[var(--surface-page)] px-6 pb-16 pt-8 lg:px-10">
          {/* Page header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {eyebrow && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-main)] lg:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex shrink-0 items-center gap-3">{actions}</div>
            )}
          </div>

          {children}
        </main>
      </div>

      <ToastContainer />
      <CommandPalette />
      <FaviconIndicator />
    </div>
    </>
  )
}
