import { Pencil, Plus, Server, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDeleteService, useServices } from '@/lib/api'
import { PageNotice } from '@/components/page-notice'
import { useSelectedProject } from '@/hooks/use-selected-project'
import { CreateServiceModal } from '@/features/create/create-service-modal'

export function ServicesPage() {
  const { project } = useSelectedProject()
  const { data: services, isLoading, isError, refetch } = useServices(project?.slug)
  const { mutateAsync: deleteService } = useDeleteService()
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (isLoading) {
    return <PageNotice variant="loading" message="Loading services…" />
  }

  if (isError || !services) {
    return (
      <PageNotice
        variant="error"
        message="Could not reach the API."
        onRetry={() => void refetch()}
      />
    )
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Server className="mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-lg font-semibold text-[var(--text-main)]">No services yet</p>
        <p className="mt-1 max-w-sm text-center text-sm text-[var(--text-muted)]">
          Create a service to group your monitors and deployments.
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="mt-5 flex items-center gap-1 border border-[var(--border-soft)] px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
        >
          <Plus className="h-4 w-4" />
          Create service
        </button>
        {project && (
          <CreateServiceModal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            projectId={project.id}
          />
        )}
      </div>
    )
  }

  return (
    <>
      <div className="border border-[var(--border-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-main)]">All services</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
          >
            <Plus className="h-3 w-3" />
            Create
          </button>
        </div>

        <div className="divide-y divide-[var(--border-soft)]">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-main)]">{service.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{service.slug}</p>
                {service.description && (
                  <p className="mt-0.5 text-xs text-[var(--text-soft)]">{service.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 border-l border-[var(--border-soft)] pl-3">
                <button
                  onClick={() => alert('Edit coming soon')}
                  className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--text-main)]"
                  title="Edit service"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setDeletingId(service.id)}
                  className="flex h-7 w-7 items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)] hover:text-[var(--dot-down)]"
                  title="Delete service"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {project && (
        <CreateServiceModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          projectId={project.id}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm border border-[var(--border-soft)] bg-[var(--surface-page)]">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">Delete service</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-[var(--text-muted)]">
                Are you sure you want to delete this service? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-panel-soft)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    void deleteService(deletingId)
                    setDeletingId(null)
                  }}
                  className="border border-[var(--dot-down)] px-4 py-2 text-sm text-[var(--dot-down)] hover:bg-[var(--dot-down)]/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
