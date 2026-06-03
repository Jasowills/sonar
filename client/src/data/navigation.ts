import {
  BellRing,
  Bug,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  Package,
  Radar,
  Server,
  Settings,
  Siren,
  Users,
} from 'lucide-react'

export const navigationGroups = [
  {
    label: 'Monitoring',
    items: [
      { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
      { label: 'Monitors', path: '/app/monitors', icon: Radar },
      { label: 'Errors', path: '/app/errors', icon: Bug },
      { label: 'Incidents', path: '/app/incidents', icon: Siren },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { label: 'Deployments', path: '/app/deployments', icon: Package },
      { label: 'Integrations', path: '/app/integrations', icon: BellRing },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Services', path: '/app/services', icon: Server },
      { label: 'Environments', path: '/app/environments', icon: Layers },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Status Pages', path: '/app/status-pages', icon: LifeBuoy },
      { label: 'Team', path: '/app/team', icon: Users },
      { label: 'Settings', path: '/app/settings', icon: Settings },
    ],
  },
] as const
