import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { navigationGroups } from '@/data/navigation'
import type { Monitor, Incident, ErrorGroup } from '@/lib/api'
import { Radar, Siren, Bug } from 'lucide-react'

type EntityResult = {
  type: 'monitor' | 'incident' | 'error_group'
  id: string
  label: string
  path: string
  icon: typeof Radar
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [entities, setEntities] = useState<EntityResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const navItems = navigationGroups.flatMap((g) => g.items)

  useEffect(() => {
    if (!open) return
    const monitors = queryClient.getQueryData<Monitor[]>(['monitors']) ?? []
    const incidents = queryClient.getQueryData<Incident[]>(['incidents']) ?? []
    const errorGroups = queryClient.getQueryData<ErrorGroup[]>(['errorGroups']) ?? []

    setEntities([
      ...monitors.map((m) => ({
        type: 'monitor' as const,
        id: m.id,
        label: m.name,
        path: `/app/monitors/${m.id}`,
        icon: Radar,
      })),
      ...incidents.map((i) => ({
        type: 'incident' as const,
        id: i.id,
        label: i.title,
        path: `/app/incidents/${i.id}`,
        icon: Siren,
      })),
      ...errorGroups.map((e) => ({
        type: 'error_group' as const,
        id: e.id,
        label: e.title,
        path: `/app/errors`,
        icon: Bug,
      })),
    ])
  }, [open, queryClient])

  const q = query.trim().toLowerCase()

  const filteredNav = q
    ? navItems.filter((item) => item.label.toLowerCase().includes(q))
    : navItems

  const filteredEntities = q
    ? entities.filter((e) => e.label.toLowerCase().includes(q))
    : []

  const allResults = [...filteredNav, ...filteredEntities]

  const clampedIndex = Math.min(selectedIndex, Math.max(0, allResults.length - 1))

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && allResults[clampedIndex]) {
      const item = allResults[clampedIndex]
      if ('type' in item) {
        navigate((item as EntityResult).path)
      } else if ('path' in item) {
        navigate((item as (typeof navItems)[number]).path)
      }
      setOpen(false)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg border border-[var(--border-soft)] bg-[var(--surface-page)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, monitors, incidents, errors…"
            className="w-full bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-soft)]"
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {allResults.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              No results found
            </p>
          ) : (
            allResults.map((item, i) => {
              if ('type' in item) {
                const entity = item as EntityResult
                const EntityIcon = entity.icon
                return (
                  <button
                    key={`${entity.type}-${entity.id}`}
                    onClick={() => {
                      navigate(entity.path)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                      i === clampedIndex
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                        : 'text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]'
                    }`}
                  >
                    <EntityIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                    <span className="flex-1 truncate">{entity.label}</span>
                    <span className="text-[10px] uppercase text-[var(--text-soft)]">
                      {entity.type.replace('_', ' ')}
                    </span>
                  </button>
                )
              }
              const navItem = item as (typeof navItems)[number]
              const NavIcon = navItem.icon
              return (
                <button
                  key={navItem.path}
                  onClick={() => {
                    navigate(navItem.path)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                    i === clampedIndex
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                      : 'text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]'
                  }`}
                >
                  <NavIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <span>{navItem.label}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
