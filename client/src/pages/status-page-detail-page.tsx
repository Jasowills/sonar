import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { parseGraphqlError } from '@/lib/utils'
import {
  ArrowLeft, Plus, Trash2, ExternalLink, ChevronUp, ChevronDown,
  Eye, EyeOff, CheckCircle, Clock, XCircle, AlertTriangle,
  Layout, Palette, Type, Hash, Image, Server,
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

const STATUS_CONFIG: Record<string, { label: string; dot: string; icon: typeof CheckCircle; a11yLabel: string }> = {
  HEALTHY: { label: 'Operational', dot: 'var(--dot-healthy)', icon: CheckCircle, a11yLabel: 'Healthy' },
  DEGRADED: { label: 'Degraded Performance', dot: 'var(--dot-degraded)', icon: Clock, a11yLabel: 'Degraded' },
  DOWN: { label: 'Major Outage', dot: 'var(--dot-down)', icon: XCircle, a11yLabel: 'Down' },
  PENDING: { label: 'Unknown', dot: 'var(--text-muted)', icon: AlertTriangle, a11yLabel: 'Unknown' },
}

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

  return (
    <div
      className="h-full overflow-y-auto bg-[var(--surface-panel)]"
      style={data.brandColor ? ({ '--status-brand': data.brandColor } as React.CSSProperties) : undefined}
    >
      <div className="p-6">
        <a
          href={`${clientUrl}/status/${data.workspaceSlug}/${data.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-1 border border-[var(--border-soft)] px-2 py-1 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          Open live page
        </a>

        <div className="mb-5 text-center">
          {data.logoUrl && (
            <img src={data.logoUrl} alt="" className="mx-auto mb-3 max-h-8 object-contain" />
          )}
          <h2
            className="text-sm font-semibold tracking-tight"
            style={{
              color: data.brandColor ? 'var(--status-brand)' : 'var(--text-strong)',
            }}
          >
            {data.name}
          </h2>
          {data.headline && (
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{data.headline}</p>
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
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Updated {new Date(data.updatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {visibleServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="mb-2 h-5 w-5 text-[var(--text-muted)]" />
            <p className="text-[11px] text-[var(--text-muted)]">No services configured</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(groups.entries()).map(([groupName, services]) => (
              <div key={groupName}>
                <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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
                        <p className="text-[11px] text-[var(--text-main)]">{svc.displayName ?? svc.name}</p>
                        <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
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
                  <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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
                        <p className="text-[11px] text-[var(--text-main)]">{svc.displayName ?? svc.name}</p>
                        <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
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
          <p className="mt-5 text-center text-[10px] text-[var(--text-muted)]">{data.footerText}</p>
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

export function StatusPageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
  }, [page])

  const previewData: StatusPagePreviewData | null = useMemo(() => {
    if (!page) return null
    const visibleServices = page.services.filter((s) => s.isVisible)
    return {
      ...page,
      name,
      headline: headline || null,
      logoUrl: logoUrl || null,
      brandColor: brandColor || null,
      footerText: footerText || null,
      services: page.services,
      updatedAt: page.updatedAt,
    }
  }, [page, name, headline, logoUrl, brandColor, footerText])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[var(--text-muted)]">Loading status page…</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">Status page not found</p>
        <button
          onClick={() => navigate('/app/status-pages')}
          className="mt-4 flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to status pages
        </button>
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

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sortedServices.length) return
    const current = sortedServices[index]
    const other = sortedServices[swapIndex]
    await handleUpdateService(current.serviceId, { sortOrder: other.sortOrder })
    await handleUpdateService(other.serviceId, { sortOrder: current.sortOrder })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/app/status-pages')}
          className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Status pages
        </button>
        <a
          href={`${clientUrl}/status/${page.workspaceSlug}/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 border border-[var(--border-soft)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
        >
          <ExternalLink className="h-3 w-3" />
          View live page
        </a>
      </div>

      {mutationError && (
        <div className="mb-4 space-y-0.5">
          {mutationError.map((msg, i) => (
            <p key={i} className="text-xs text-[var(--dot-down)]">{msg}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <form onSubmit={handleSavePageInfo} className="border border-[var(--border-soft)] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Layout className="h-4 w-4 text-[var(--text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Page info</h2>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Page name"
                className="w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none"
              />
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Headline"
                className="w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none"
              />
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Hash className="h-3 w-3" />
                /{page.workspaceSlug}/{page.slug}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!id) return
                    try {
                      await deletePage(id)
                      navigate('/app/status-pages')
                    } catch (err) {
                      setMutationError(parseGraphqlError(err))
                    }
                  }}
                  className="border border-[var(--dot-down)] px-3 py-1.5 text-xs text-[var(--dot-down)] hover:bg-[var(--surface-danger)]"
                >
                  <Trash2 className="mr-1 inline-block h-3 w-3" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="border border-[var(--border-soft)] px-4 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-40"
                >
                  {isSaving ? 'Saving…' : 'Save page info'}
                </button>
              </div>
            </div>
          </form>

          <div className="border border-[var(--border-soft)] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-[var(--text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Appearance</h2>
            </div>
            <form onSubmit={handleSaveAppearance}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Image className="h-3 w-3" />
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none focus:border-[var(--accent)]"
                  />
                  {logoUrl && (
                    <img src={logoUrl} alt="" className="mt-2 h-8 object-contain" />
                  )}
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Palette className="h-3 w-3" />
                    Brand color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor || '#ffffff'}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-9 w-10 cursor-pointer border border-[var(--border-soft)] bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1 border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm font-mono text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Type className="h-3 w-3" />
                    Footer text
                  </label>
                  <textarea
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Powered by Sonar"
                    rows={2}
                    className="w-full resize-none border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="mt-4 border border-[var(--border-soft)] px-4 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-40"
              >
                {isSaving ? 'Saving…' : 'Save appearance'}
              </button>
            </form>
          </div>

          <div className="border border-[var(--border-soft)] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Server className="h-4 w-4 text-[var(--text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--text-main)]">
                Services ({page.services.length})
              </h2>
              <span className="ml-auto text-[10px] text-[var(--text-muted)]">
                {page.services.filter(s => s.isVisible).length} visible
              </span>
            </div>

            {sortedServices.length > 0 && (
              <div className="mb-4 divide-y divide-[var(--border-soft)] border border-[var(--border-soft)]">
                {sortedServices.map((svc, index) => {
                  const statusInfo = STATUS_CONFIG[svc.status] ?? STATUS_CONFIG.PENDING
                  const StatusIcon = statusInfo.icon
                  return (
                    <div
                      key={svc.id}
                      className={`px-4 py-3 ${!svc.isVisible ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="flex flex-col pt-0.5">
                            <button
                              onClick={() => handleReorder(index, 'up')}
                              disabled={index === 0}
                              className="text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-20"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleReorder(index, 'down')}
                              disabled={index === sortedServices.length - 1}
                              className="text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-20"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-[var(--text-main)]">{svc.displayName ?? svc.name}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <input
                                type="text"
                                defaultValue={svc.displayName ?? ''}
                                placeholder="Display name"
                                onBlur={(e) => {
                                  const val = e.target.value.trim()
                                  if (val !== (svc.displayName ?? '')) {
                                    handleUpdateService(svc.serviceId, { displayName: val || null })
                                  }
                                }}
                                 className="w-32 border border-[var(--border-soft)] bg-transparent px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--accent)]"
                              />
                              <input
                                type="text"
                                defaultValue={svc.groupName ?? ''}
                                placeholder="Group"
                                onBlur={(e) => {
                                  const val = e.target.value.trim()
                                  if (val !== (svc.groupName ?? '')) {
                                    handleUpdateService(svc.serviceId, { groupName: val || null })
                                  }
                                }}
                                className="w-28 border border-[var(--border-soft)] bg-transparent px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--accent)]"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                          <button
                            onClick={() => handleUpdateService(svc.serviceId, { isVisible: !svc.isVisible })}
                            className="border border-[var(--border-soft)] px-1.5 py-1 text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                            title={svc.isVisible ? 'Visible on public page' : 'Hidden from public page'}
                          >
                            {svc.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </button>
                          <span
                            className="flex items-center gap-1 border px-1.5 py-0.5 text-[10px]"
                            style={{ borderColor: statusInfo.dot, color: statusInfo.dot }}
                          >
                            <StatusIcon className="h-2.5 w-2.5" aria-hidden="true" />
                            {statusInfo.label}
                          </span>
                          <button
                            onClick={() => handleRemoveService(svc.serviceId)}
                            className="border border-[var(--border-soft)] px-1.5 py-1 text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
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
            )}

            {availableServices.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="flex-1 border border-[var(--border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] outline-none"
                >
                  <option value="">Select a service to add…</option>
                  {availableServices.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddService}
                  disabled={!selectedServiceId || isAddingService}
                  className="flex items-center gap-2 border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)] disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  {isAddingService ? 'Adding…' : 'Add'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                {sortedServices.length > 0 ? 'All services are linked.' : 'Create a service first to link it here.'}
              </p>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="border border-[var(--border-soft)]">
            <div className="border-b border-[var(--border-soft)] px-4 py-2.5">
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
