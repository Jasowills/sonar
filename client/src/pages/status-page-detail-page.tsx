import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { parseGraphqlError } from '@/lib/utils'
import {
  ArrowLeft, Plus, Trash2, ExternalLink, ChevronUp, ChevronDown,
  Eye, EyeOff, CheckCircle, Clock, XCircle, AlertTriangle,
  Layout, Palette, Type, Image, Server, Sun, Moon,
  Loader2,
} from 'lucide-react'
import {
  useStatusPage,
  useUpdateStatusPage,
  useDeleteStatusPage,
  useAddStatusPageService,
  useRemoveStatusPageService,
  useUpdateStatusPageService,
  useServices,
} from '@/lib/api'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

const STATUS_CONFIG: Record<string, { label: string; dot: string; icon: typeof CheckCircle; a11yLabel: string }> = {
  HEALTHY: { label: 'Operational', dot: 'var(--dot-healthy)', icon: CheckCircle, a11yLabel: 'Healthy' },
  DEGRADED: { label: 'Degraded Performance', dot: 'var(--dot-degraded)', icon: Clock, a11yLabel: 'Degraded' },
  DOWN: { label: 'Major Outage', dot: 'var(--dot-down)', icon: XCircle, a11yLabel: 'Down' },
  PENDING: { label: 'Unknown', dot: 'var(--text-muted)', icon: AlertTriangle, a11yLabel: 'Unknown' },
}

const LABEL_CLS = 'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)]'
const INPUT_CLS = 'w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]'

function computeOverall(services: Array<{ status: string }>) {
  let hasDown = false
  let hasDegraded = false
  for (const s of services) {
    if (s.status === 'DOWN') hasDown = true
    else if (s.status === 'DEGRADED') hasDegraded = true
  }
  if (hasDown) return { label: 'Major Outage', color: STATUS_CONFIG.DOWN.dot, icon: STATUS_CONFIG.DOWN.icon }
  if (hasDegraded) return { label: 'Partial Outage', color: STATUS_CONFIG.DEGRADED.dot, icon: STATUS_CONFIG.DEGRADED.icon }
  return { label: 'All Systems Operational', color: STATUS_CONFIG.HEALTHY.dot, icon: STATUS_CONFIG.HEALTHY.icon }
}

function StatusPagePreview({ data, clientUrl }: { data: StatusPagePreviewData; clientUrl: string }) {
  const overall = computeOverall(data.services)
  const OverallIcon = overall.icon
  const visibleServices = data.services.filter((s) => s.isVisible)

  const isDark = data.theme === 'DARK' || (data.theme === 'AUTO' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const groups = new Map<string, typeof visibleServices>()
  const ungrouped: typeof visibleServices = []
  for (const svc of visibleServices) {
    if (svc.groupName) {
      const existing = groups.get(svc.groupName) ?? []
      existing.push(svc)
      groups.set(svc.groupName, existing)
    } else {
      ungrouped.push(svc)
    }
  }

  const themeVars: Record<string, string> = isDark ? {
    '--surface-page': 'oklch(0.065 0 0)',
    '--surface-panel': 'oklch(0.105 0 0)',
    '--surface-panel-soft': 'oklch(0.14 0 0)',
    '--surface-elevated': 'oklch(0.12 0 0)',
    '--surface-inverse': 'oklch(0.92 0 0)',
    '--surface-inverse-soft': 'oklch(0.82 0 0)',
    '--border-soft': 'oklch(0.16 0 0)',
    '--border-strong': 'oklch(0.26 0 0)',
    '--text-main': 'oklch(0.96 0 0)',
    '--text-strong': 'oklch(0.98 0 0)',
    '--text-muted': 'oklch(0.65 0 0)',
    '--text-soft': 'oklch(0.50 0 0)',
    '--accent': 'oklch(0.6 0.18 240)',
    '--accent-strong': 'oklch(0.75 0.15 240)',
    '--accent-soft': 'oklch(0.25 0.1 240)',
    '--surface-danger': 'oklch(0.18 0.06 25)',
    '--surface-success': 'oklch(0.20 0.05 145)',
    '--surface-warning': 'oklch(0.22 0.05 85)',
    '--dot-healthy': 'oklch(0.60 0.12 145)',
    '--dot-degraded': 'oklch(0.65 0.10 85)',
    '--dot-down': 'oklch(0.55 0.14 25)',
    '--page-glow': 'color-mix(in oklch, white 6%, transparent)',
    'color-scheme': 'dark',
  } : {
    '--surface-page': 'oklch(0.97 0 0)',
    '--surface-panel': 'oklch(1 0 0)',
    '--surface-panel-soft': 'oklch(0.935 0 0)',
    '--surface-elevated': 'oklch(1 0 0)',
    '--surface-inverse': 'oklch(0.12 0 0)',
    '--surface-inverse-soft': 'oklch(0.28 0 0)',
    '--border-soft': 'oklch(0.88 0 0)',
    '--border-strong': 'oklch(0.74 0 0)',
    '--text-main': 'oklch(0.14 0 0)',
    '--text-strong': 'oklch(0.06 0 0)',
    '--text-muted': 'oklch(0.38 0 0)',
    '--text-soft': 'oklch(0.52 0 0)',
    '--accent': 'oklch(0.45 0.15 240)',
    '--accent-strong': 'oklch(0.32 0.18 240)',
    '--accent-soft': 'oklch(0.86 0.06 240)',
    '--surface-danger': 'oklch(0.82 0.06 25)',
    '--surface-success': 'oklch(0.90 0.05 145)',
    '--surface-warning': 'oklch(0.88 0.05 85)',
    '--dot-healthy': 'oklch(0.50 0.12 145)',
    '--dot-degraded': 'oklch(0.55 0.10 85)',
    '--dot-down': 'oklch(0.45 0.14 25)',
    '--page-glow': 'transparent',
    'color-scheme': 'light',
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        background: 'var(--surface-page)',
        ...(data.brandColor ? { '--status-brand': data.brandColor } as React.CSSProperties : {}),
        ...themeVars,
      }}
    >
      <div className="p-6">
        <a
          href={`${clientUrl}/status/${data.workspaceSlug}/${data.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-1 rounded-md border border-[var(--border-soft)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Open live page
        </a>

        <div className="mb-5 text-center">
          {(() => {
            const src = isDark && data.darkLogoUrl ? data.darkLogoUrl : data.logoUrl
            if (!src) return null
            return data.logoLinkUrl ? (
              <a href={data.logoLinkUrl} target="_blank" rel="noopener noreferrer" className="mx-auto mb-3 inline-block">
                <img src={src} alt="" className="max-h-8 object-contain" />
              </a>
            ) : (
              <img src={src} alt="" className="mx-auto mb-3 max-h-8 object-contain" />
            )
          })()}
          <h2
            className="text-sm font-semibold tracking-tight"
            style={{
              color: data.brandColor ? 'var(--status-brand)' : 'var(--text-strong)',
            }}
          >
            {data.name}
          </h2>
            {data.headline && (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{data.headline}</p>
          )}
        </div>

        <div
          className="mb-5 rounded-lg px-4 py-4"
          style={{
            backgroundColor: `color-mix(in srgb, ${overall.color} 8%, transparent)`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: overall.color }}
              aria-hidden="true"
            />
            <OverallIcon
              className="h-3.5 w-3.5"
              style={{ color: overall.color }}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold" style={{ color: overall.color }}>
              {overall.label}
            </span>
          </div>
          {data.updatedAt && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Updated {new Date(data.updatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {visibleServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="mb-2 h-5 w-5 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)]">No services configured</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(groups.entries()).map(([groupName, services]) => (
              <div key={groupName}>
                <h3 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {groupName}
                </h3>
                <div className="overflow-hidden rounded-md border border-[var(--border-soft)]">
                  {services.map((svc) => {
                    const config = STATUS_CONFIG[svc.status] ?? STATUS_CONFIG.PENDING
                    return (
                      <div
                        key={svc.id}
                        className="flex items-center justify-between border-b border-[var(--border-soft)] px-3 py-2.5 last:border-b-0"
                      >
                        <p className="text-xs text-[var(--text-main)]">{svc.displayName ?? svc.name}</p>
                        <span className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: config.dot }}
                            aria-hidden="true"
                          />
                          <span className="sr-only">{config.a11yLabel}</span>
                          {config.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {ungrouped.length > 0 && (
              <div>
                {groups.size > 0 && (
                  <h3 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Other Services
                  </h3>
                )}
                <div className="overflow-hidden rounded-md border border-[var(--border-soft)]">
                  {ungrouped.map((svc) => {
                    const config = STATUS_CONFIG[svc.status] ?? STATUS_CONFIG.PENDING
                    return (
                      <div
                        key={svc.id}
                        className="flex items-center justify-between border-b border-[var(--border-soft)] px-3 py-2.5 last:border-b-0"
                      >
                        <p className="text-xs text-[var(--text-main)]">{svc.displayName ?? svc.name}</p>
                        <span className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: config.dot }}
                            aria-hidden="true"
                          />
                          <span className="sr-only">{config.a11yLabel}</span>
                          {config.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {data.footerText && (
          <p className="mt-5 text-center text-xs text-[var(--text-muted)]">{data.footerText}</p>
        )}
      </div>
    </div>
  )
}

type StatusPagePreviewData = {
  id: string
  name: string
  slug: string
  headline: string | null
  logoUrl: string | null
  brandColor: string | null
  footerText: string | null
  theme: string
  darkLogoUrl: string | null
  logoLinkUrl: string | null
  updatedAt: string
  workspaceSlug: string
  services: Array<{
    id: string
    serviceId: string
    name: string
    displayName: string | null
    groupName: string | null
    isVisible: boolean
    status: string
    latencyMs: number | null
    sortOrder: number
  }>
}

function SectionCard({ icon: Icon, title, children, actions }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text-main)]">{title}</h2>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export function StatusPageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: page, isLoading, error } = useStatusPage(id ?? '')
  const { project } = useSelectedProject()
  const { data: allServices } = useServices(project?.slug)
  const { mutateAsync: updatePage, isPending: isSaving } = useUpdateStatusPage()
  const { mutateAsync: addService, isPending: isAddingService } = useAddStatusPageService()
  const { mutateAsync: removeService } = useRemoveStatusPageService()
  const { mutateAsync: updateServiceFields } = useUpdateStatusPageService()
  const { mutateAsync: deletePage } = useDeleteStatusPage()

  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('')
  const [footerText, setFooterText] = useState('')
  const [theme, setTheme] = useState('LIGHT')
  const [darkLogoUrl, setDarkLogoUrl] = useState('')
  const [logoLinkUrl, setLogoLinkUrl] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [mutationError, setMutationError] = useState<string[] | null>(null)


  const clientUrl = import.meta.env.VITE_CLIENT_URL ?? 'http://localhost:3000'

  useEffect(() => {
    if (!page) return
    setName(page.name)
    setHeadline(page.headline ?? '')
    setVisibility(page.visibility)
    setLogoUrl(page.logoUrl ?? '')
    setBrandColor(page.brandColor ?? '')
    setFooterText(page.footerText ?? '')
    setTheme(page.theme ?? 'LIGHT')
    setDarkLogoUrl(page.darkLogoUrl ?? '')
    setLogoLinkUrl(page.logoLinkUrl ?? '')
  }, [page])

  const previewData: StatusPagePreviewData | null = useMemo(() => {
    if (!page) return null
    return {
      ...page,
      name,
      headline: headline || null,
      logoUrl: logoUrl || null,
      brandColor: brandColor || null,
      footerText: footerText || null,
      theme,
      darkLogoUrl: darkLogoUrl || null,
      logoLinkUrl: logoLinkUrl || null,
      services: page.services,
      updatedAt: page.updatedAt,
    }
  }, [page, name, headline, logoUrl, brandColor, footerText, theme, darkLogoUrl, logoLinkUrl])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        <p className="mt-4 text-sm text-[var(--text-muted)]">Loading status page…</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">Status page not found</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/status-pages')}
          className="mt-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to status pages
        </Button>
      </div>
    )
  }

  const linkedServiceIds = new Set(page.services.map((s) => s.serviceId))
  const availableServices = (allServices ?? []).filter((s) => !linkedServiceIds.has(s.id))
  const sortedServices = [...page.services].sort((a, b) => a.sortOrder - b.sortOrder)

  const handleSavePageInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await updatePage({ id, name, headline: headline || null, visibility })
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleSaveAppearance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await updatePage({
        id,
        logoUrl: logoUrl || null,
        brandColor: brandColor || null,
        footerText: footerText || null,
        theme: theme,
        darkLogoUrl: darkLogoUrl || null,
        logoLinkUrl: logoLinkUrl || null,
      })
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleAddService = async () => {
    if (!id || !selectedServiceId) return
    try {
      const maxOrder = page.services.reduce((m, s) => Math.max(m, s.sortOrder), 0)
      await addService({ statusPageId: id, serviceId: selectedServiceId, sortOrder: maxOrder + 1 })
      setSelectedServiceId('')
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleRemoveService = async (serviceId: string) => {
    if (!id) return
    try {
      await removeService({ statusPageId: id, serviceId })
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleUpdateService = async (
    serviceId: string,
    fields: { displayName?: string | null; groupName?: string | null; sortOrder?: number; isVisible?: boolean },
  ) => {
    if (!id) return
    try {
      await updateServiceFields({ statusPageId: id, serviceId, ...fields })
      setMutationError(null)
    } catch (err) {
      setMutationError(parseGraphqlError(err))
    }
  }

  const handleReorder = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sortedServices.length) return
    const current = sortedServices[index]
    const other = sortedServices[swapIndex]

    queryClient.setQueryData(['statusPage', id], (old: unknown) => {
      if (!old || typeof old !== 'object') return old
      const data = old as { services: Array<{ serviceId: string; sortOrder: number }> }
      return {
        ...data,
        services: data.services.map((s) => {
          if (s.serviceId === current.serviceId) return { ...s, sortOrder: other.sortOrder }
          if (s.serviceId === other.serviceId) return { ...s, sortOrder: current.sortOrder }
          return s
        }),
      }
    })

    handleUpdateService(current.serviceId, { sortOrder: other.sortOrder }).catch(() => {})
    handleUpdateService(other.serviceId, { sortOrder: current.sortOrder }).catch(() => {})
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/status-pages')}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="h-4 w-px bg-[var(--border-soft)]" />
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-main)]">{page.name}</h1>
            <p className="font-mono text-[10px] text-[var(--text-muted)]">
              /{page.workspaceSlug}/{page.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!id) return
              try {
                await deletePage(id)
                navigate('/app/status-pages')
              } catch (err) {
                setMutationError(parseGraphqlError(err))
              }
            }}
            className="border-[var(--dot-down)]/40 text-[var(--dot-down)] hover:bg-[var(--surface-danger)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`${clientUrl}/status/${page.workspaceSlug}/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View live page
            </a>
          </Button>
        </div>
      </div>

      {/* Mutation error */}
      {mutationError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-[var(--dot-down)]/20 bg-[var(--surface-danger)]/30 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--dot-down)]" />
          <div className="space-y-0.5">
            {mutationError.map((msg, i) => (
              <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Page info */}
          <SectionCard icon={Layout} title="Page info">
            <form onSubmit={handleSavePageInfo}>
              <div className="space-y-4 p-5">
                <div>
                  <label className={LABEL_CLS}>Page name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="My Status Page"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Current status of our services"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Visibility</label>
                  <Select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    options={[
                      { value: 'PUBLIC', label: 'Public — anyone with the link can view' },
                      { value: 'PRIVATE', label: 'Private — only team members can view' },
                    ]}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end border-t border-[var(--border-soft)] px-5 py-3">
                <Button type="submit" variant="outline" size="sm" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save page info'}
                </Button>
              </div>
            </form>
          </SectionCard>

          {/* Appearance */}
          <SectionCard icon={Palette} title="Appearance">
            <form onSubmit={handleSaveAppearance}>
              <div className="space-y-5 p-5">
                <div>
                  <label className={LABEL_CLS}>
                    <Image className="mr-1 inline h-3 w-3 align-text-bottom" />
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={INPUT_CLS}
                  />
                  {logoUrl && (
                    <div className="mt-2 flex items-center gap-3 rounded-md border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-3 py-2">
                      <img src={logoUrl} alt="" className="h-6 object-contain" />
                      <span className="truncate font-mono text-[10px] text-[var(--text-muted)]">{logoUrl}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className={LABEL_CLS}>
                    <Moon className="mr-1 inline h-3 w-3 align-text-bottom" />
                    Dark mode logo URL
                  </label>
                  <input
                    type="text"
                    value={darkLogoUrl}
                    onChange={(e) => setDarkLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo-dark.png"
                    className={INPUT_CLS}
                  />
                  {darkLogoUrl && (
                    <div className="mt-2 flex items-center gap-3 rounded-md border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-3 py-2">
                      <img src={darkLogoUrl} alt="" className="h-6 object-contain" />
                      <span className="truncate font-mono text-[10px] text-[var(--text-muted)]">{darkLogoUrl}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className={LABEL_CLS}>
                    <ExternalLink className="mr-1 inline h-3 w-3 align-text-bottom" />
                    Logo link URL
                  </label>
                  <input
                    type="url"
                    value={logoLinkUrl}
                    onChange={(e) => setLogoLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className={INPUT_CLS}
                  />
                  <p className="mt-1 font-mono text-[10px] text-[var(--text-soft)]">
                    Clicking the logo on your status page will open this link.
                  </p>
                </div>
                <div className="border-t border-[var(--border-soft)] pt-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>
                        <Palette className="mr-1 inline h-3 w-3 align-text-bottom" />
                        Brand color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandColor || '#ffffff'}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-[var(--border-soft)] bg-transparent p-0.5"
                        />
                        <input
                          type="text"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          placeholder="#ffffff"
                          className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 font-mono text-xs text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>
                        <Sun className="mr-1 inline h-3 w-3 align-text-bottom" />
                        Theme
                      </label>
                      <Select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        options={[
                          { value: 'LIGHT', label: 'Light' },
                          { value: 'DARK', label: 'Dark' },
                          { value: 'AUTO', label: 'Auto (system)' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>
                    <Type className="mr-1 inline h-3 w-3 align-text-bottom" />
                    Footer text
                  </label>
                  <textarea
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Powered by Sonar"
                    rows={2}
                    className="w-full resize-none rounded-md border border-[var(--border-soft)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition-colors focus:border-[var(--text-muted)]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end border-t border-[var(--border-soft)] px-5 py-3">
                <Button type="submit" variant="outline" size="sm" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save appearance'}
                </Button>
              </div>
            </form>
          </SectionCard>

          {/* Services */}
          <SectionCard
            icon={Server}
            title="Services"
            actions={
              <span className="font-mono text-[10px] text-[var(--text-soft)]">
                {page.services.filter(s => s.isVisible).length} / {page.services.length} visible
              </span>
            }
          >
            <div className="p-5">
              {sortedServices.length > 0 ? (
                <div className="mb-4 space-y-1.5">
                  {sortedServices.map((svc, index) => {
                    const statusInfo = STATUS_CONFIG[svc.status] ?? STATUS_CONFIG.PENDING
                    const StatusIcon = statusInfo.icon
                    return (
                      <div
                        key={svc.id}
                        className={`rounded-lg border border-[var(--border-soft)] bg-[var(--surface-page)] px-4 py-3 transition-all hover:border-[var(--border-strong)] ${!svc.isVisible ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="flex flex-col gap-px">
                              <button
                                onClick={() => handleReorder(index, 'up')}
                                disabled={index === 0}
                                className="text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-20 transition-colors"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleReorder(index, 'down')}
                                disabled={index === sortedServices.length - 1}
                                className="text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-20 transition-colors"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: statusInfo.dot }}
                                />
                                <p className="text-sm text-[var(--text-main)]">{svc.displayName ?? svc.name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateService(svc.serviceId, { isVisible: !svc.isVisible })}
                              className="rounded-md border border-[var(--border-soft)] px-1.5 py-1 text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] transition-colors"
                              title={svc.isVisible ? 'Visible on public page' : 'Hidden from public page'}
                            >
                              {svc.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </button>
                            <span
                              className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                              style={{ borderColor: statusInfo.dot, color: statusInfo.dot }}
                            >
                              <StatusIcon className="h-2.5 w-2.5" aria-hidden="true" />
                              {statusInfo.label}
                            </span>
                            <button
                              onClick={() => handleRemoveService(svc.serviceId)}
                              className="rounded-md border border-[var(--border-soft)] px-1.5 py-1 text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] transition-colors"
                              title="Remove from status page"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mb-4 flex flex-col items-center justify-center py-8 text-center">
                  <Server className="mb-2 h-6 w-6 text-[var(--text-soft)]" />
                  <p className="text-sm text-[var(--text-muted)]">No services added yet</p>
                  <p className="text-xs text-[var(--text-soft)]">Add services from the selector below.</p>
                </div>
              )}

              {availableServices.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    placeholder="Select a service…"
                    options={availableServices.map((s) => ({ value: s.id, label: s.name }))}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddService}
                    disabled={!selectedServiceId || isAddingService}
                  >
                    <Plus className="h-4 w-4" />
                    {isAddingService ? 'Adding…' : 'Add'}
                  </Button>
                </div>
              ) : (
                <p className="text-center font-mono text-[10px] text-[var(--text-muted)]">
                  {sortedServices.length > 0 ? 'All available services are linked.' : 'Create a service first to link it here.'}
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-[var(--border-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--text-main)]">Preview</p>
            </div>
            <div className="h-[calc(100vh-10rem)]">
              {previewData && (
                <StatusPagePreview data={previewData} clientUrl={clientUrl} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
