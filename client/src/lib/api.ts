import { GraphQLClient, gql } from 'graphql-request'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getToken, clearToken } from '@/hooks/use-auth'

const endpoint =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8080/graphql'

function authFetch(input: URL | RequestInfo, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}

function handleUnauthorized(response: Response): Response {
  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
  }
  return response
}

const interceptedFetch: typeof fetch = (input, init) =>
  authFetch(input, init).then((res) => {
    if (res.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return res
  })

export const graphqlClient = new GraphQLClient(endpoint, {
  fetch: interceptedFetch,
})

export type Workspace = {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export type Project = {
  id: string
  name: string
  slug: string
  workspaceId: string
  createdAt: string
  updatedAt: string
}

export type Environment = {
  id: string
  name: string
  key: string
  color: string | null
  projectId: string
}

export type MonitorState = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'PENDING'

export type Monitor = {
  id: string
  name: string
  targetUrl: string
  method: string
  expectedStatus: number
  intervalSeconds: number
  timeoutSeconds: number
  isActive: boolean
  serviceId: string
  serviceName: string
  environmentId: string
  environmentName: string
  latestState: MonitorState
  latestLatencyMs: number | null
  updatedAt: string
}

export type OverviewMetric = {
  label: string
  value: string
  detail: string
}

export type OverviewSnapshot = {
  workspaceName: string
  projectName: string
  productionMonitorCount: number
  monitors: Monitor[]
  metrics: OverviewMetric[]
}

const OVERVIEW_SNAPSHOT_QUERY = gql`
  query OverviewSnapshot($workspaceSlug: String) {
    overviewSnapshot(workspaceSlug: $workspaceSlug) {
      workspaceName
      projectName
      productionMonitorCount
      metrics {
        label
        value
        detail
      }
      monitors {
        id
        name
        targetUrl
        method
        intervalSeconds
        serviceName
        environmentName
        latestState
        latestLatencyMs
      }
    }
  }
`

const MONITORS_QUERY = gql`
  query Monitors($projectSlug: String, $environmentKey: String) {
    monitors(projectSlug: $projectSlug, environmentKey: $environmentKey) {
      id
      name
      targetUrl
      method
      expectedStatus
      intervalSeconds
      timeoutSeconds
      isActive
      serviceId
      serviceName
      environmentId
      environmentName
      latestState
      latestLatencyMs
      updatedAt
    }
  }
`

const WORKSPACES_QUERY = gql`
  query Workspaces {
    workspaces {
      id
      name
      slug
    }
  }
`

const PROJECTS_QUERY = gql`
  query Projects($workspaceSlug: String) {
    projects(workspaceSlug: $workspaceSlug) {
      id
      name
      slug
      workspaceId
    }
  }
`

export function useOverviewSnapshot(workspaceSlug?: string) {
  return useQuery({
    queryKey: ['overviewSnapshot', workspaceSlug ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        overviewSnapshot: OverviewSnapshot
      }>(OVERVIEW_SNAPSHOT_QUERY, { workspaceSlug })
      return data.overviewSnapshot
    },
    refetchInterval: 15_000,
  })
}

export function useMonitors(projectSlug?: string, environmentKey?: string) {
  return useQuery({
    queryKey: ['monitors', projectSlug ?? null, environmentKey ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{ monitors: Monitor[] }>(
        MONITORS_QUERY,
        { projectSlug, environmentKey },
      )
      return data.monitors
    },
    refetchInterval: 15_000,
  })
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const data = await graphqlClient.request<{ workspaces: Workspace[] }>(
        WORKSPACES_QUERY,
      )
      return data.workspaces
    },
  })
}

export function useProjects(workspaceSlug?: string) {
  return useQuery({
    queryKey: ['projects', workspaceSlug ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{ projects: Project[] }>(
        PROJECTS_QUERY,
        { workspaceSlug },
      )
      return data.projects
    },
  })
}

export type Service = {
  id: string
  name: string
  slug: string
  description: string | null
  projectId: string
}

const SERVICES_QUERY = gql`
  query Services($projectSlug: String) {
    services(projectSlug: $projectSlug) {
      id
      name
      slug
      description
      projectId
    }
  }
`

const ENVIRONMENTS_QUERY = gql`
  query Environments($projectSlug: String) {
    environments(projectSlug: $projectSlug) {
      id
      name
      key
      color
      projectId
    }
  }
`

export function useServices(projectSlug?: string) {
  return useQuery({
    queryKey: ['services', projectSlug ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{ services: Service[] }>(
        SERVICES_QUERY,
        { projectSlug },
      )
      return data.services
    },
  })
}

export function useEnvironments(projectSlug?: string) {
  return useQuery({
    queryKey: ['environments', projectSlug ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{ environments: Environment[] }>(
        ENVIRONMENTS_QUERY,
        { projectSlug },
      )
      return data.environments
    },
  })
}

export type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  createdAt: string
  userId: string
  workspaceId: string
}

const NOTIFICATIONS_QUERY = gql`
  query Notifications($workspaceId: String, $limit: Int) {
    notifications(workspaceId: $workspaceId, limit: $limit) {
      id
      type
      title
      body
      link
      read
      createdAt
    }
  }
`

const UNREAD_COUNT_QUERY = gql`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`

const MARK_READ = gql`
  mutation MarkNotificationRead($id: String!) {
    markNotificationRead(id: $id)
  }
`

const MARK_ALL_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`

export function useNotifications(workspaceId?: string, limit = 20) {
  return useQuery({
    queryKey: ['notifications', workspaceId ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        notifications: Notification[]
      }>(NOTIFICATIONS_QUERY, { workspaceId, limit })
      return data.notifications
    },
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        unreadNotificationCount: number
      }>(UNREAD_COUNT_QUERY)
      return data.unreadNotificationCount
    },
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await graphqlClient.request(MARK_READ, { id })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await graphqlClient.request(MARK_ALL_READ)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    },
  })
}

// --- Mutations -------------------------------------------------------------

export type CreateWorkspaceInput = {
  name: string
  slug?: string
}

export type UpdateWorkspaceInput = {
  id: string
  name: string
}

export type CreateProjectInput = {
  workspaceId: string
  name: string
  slug?: string
}

export type CreateEnvironmentInput = {
  projectId: string
  name: string
  key?: string
  color?: string
}

export type CreateServiceInput = {
  projectId: string
  name: string
  slug?: string
  description?: string
}

export type CreateMonitorInput = {
  serviceId: string
  environmentId: string
  name: string
  targetUrl: string
  method?: string
  expectedStatus?: number
  expectedKeyword?: string
  intervalSeconds?: number
  timeoutSeconds?: number
}

export type UpdateMonitorInput = {
  id: string
  name?: string
  targetUrl?: string
  method?: string
  expectedStatus?: number
  expectedKeyword?: string
  intervalSeconds?: number
  timeoutSeconds?: number
  isActive?: boolean
}

const MONITOR_FIELDS = `
  id
  name
  targetUrl
  method
  expectedStatus
  intervalSeconds
  timeoutSeconds
  isActive
  serviceId
  serviceName
  environmentId
  environmentName
  latestState
  latestLatencyMs
  updatedAt
`

const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) { id name slug }
  }
`

const UPDATE_WORKSPACE = gql`
  mutation UpdateWorkspace($input: UpdateWorkspaceInput!) {
    updateWorkspace(input: $input) { id name slug }
  }
`

const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) { id name slug workspaceId }
  }
`

const CREATE_ENVIRONMENT = gql`
  mutation CreateEnvironment($input: CreateEnvironmentInput!) {
    createEnvironment(input: $input) { id name key color projectId }
  }
`

const CREATE_SERVICE = gql`
  mutation CreateService($input: CreateServiceInput!) {
    createService(input: $input) { id name slug description projectId }
  }
`

const CREATE_MONITOR = gql`
  mutation CreateMonitor($input: CreateMonitorInput!) {
    createMonitor(input: $input) { ${MONITOR_FIELDS} }
  }
`

const UPDATE_MONITOR = gql`
  mutation UpdateMonitor($input: UpdateMonitorInput!) {
    updateMonitor(input: $input) { ${MONITOR_FIELDS} }
  }
`

const DELETE_MONITOR = gql`
  mutation DeleteMonitor($id: String!) {
    deleteMonitor(id: $id)
  }
`

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const data = await graphqlClient.request<{ createWorkspace: Workspace }>(
        CREATE_WORKSPACE,
        { input },
      )
      return data.createWorkspace
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateWorkspaceInput) => {
      const data = await graphqlClient.request<{ updateWorkspace: Workspace }>(
        UPDATE_WORKSPACE,
        { input },
      )
      return data.updateWorkspace
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const data = await graphqlClient.request<{ createProject: Project }>(
        CREATE_PROJECT,
        { input },
      )
      return data.createProject
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useCreateEnvironment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateEnvironmentInput) => {
      const data = await graphqlClient.request<{
        createEnvironment: Environment
      }>(CREATE_ENVIRONMENT, { input })
      return data.createEnvironment
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['environments'] })
    },
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateServiceInput) => {
      const data = await graphqlClient.request<{ createService: unknown }>(
        CREATE_SERVICE,
        { input },
      )
      return data.createService
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

function useMonitorsRefresh() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['monitors'] })
    void queryClient.invalidateQueries({ queryKey: ['overviewSnapshot'] })
  }
}

export function useCreateMonitor() {
  const refresh = useMonitorsRefresh()
  return useMutation({
    mutationFn: async (input: CreateMonitorInput) => {
      const data = await graphqlClient.request<{ createMonitor: Monitor }>(
        CREATE_MONITOR,
        { input },
      )
      return data.createMonitor
    },
    onSuccess: refresh,
  })
}

export function useUpdateMonitor() {
  const refresh = useMonitorsRefresh()
  return useMutation({
    mutationFn: async (input: UpdateMonitorInput) => {
      const data = await graphqlClient.request<{ updateMonitor: Monitor }>(
        UPDATE_MONITOR,
        { input },
      )
      return data.updateMonitor
    },
    onSuccess: refresh,
  })
}

export function useDeleteMonitor() {
  const refresh = useMonitorsRefresh()
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await graphqlClient.request<{ deleteMonitor: boolean }>(
        DELETE_MONITOR,
        { id },
      )
      return data.deleteMonitor
    },
    onSuccess: refresh,
  })
}

// --- Incidents -------------------------------------------------------------

export type Incident = {
  id: string
  title: string
  summary: string | null
  severity: string
  status: string
  startedAt: string
  resolvedAt: string | null
  createdAt: string
  workspaceId: string
  projectId: string
  environmentId: string | null
  serviceId: string | null
  ownerUserId: string | null
}

const INCIDENTS_QUERY = gql`
  query Incidents {
    incidents {
      id
      title
      summary
      severity
      status
      startedAt
      resolvedAt
      createdAt
      workspaceId
      projectId
      environmentId
      serviceId
      ownerUserId
    }
  }
`

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const data = await graphqlClient.request<{ incidents: Incident[] }>(
        INCIDENTS_QUERY,
      )
      return data.incidents
    },
  })
}

// --- Alerts ----------------------------------------------------------------

export type AlertChannel = {
  id: string
  name: string
  type: string
  destination: string
  secretRef: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  workspaceId: string
  creatorUserId: string | null
}

export type AlertRule = {
  id: string
  name: string
  triggerType: string
  minimumSeverity: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  workspaceId: string
  projectId: string | null
  environmentId: string | null
  serviceId: string | null
  alertChannelId: string
}

const ALERT_CHANNELS_QUERY = gql`
  query AlertChannels {
    alertChannels {
      id
      name
      type
      destination
      secretRef
      isEnabled
      workspaceId
    }
  }
`

const ALERT_RULES_QUERY = gql`
  query AlertRules {
    alertRules {
      id
      name
      triggerType
      minimumSeverity
      isEnabled
      workspaceId
      projectId
      environmentId
      serviceId
      alertChannelId
    }
  }
`

export function useAlertChannels() {
  return useQuery({
    queryKey: ['alertChannels'],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        alertChannels: AlertChannel[]
      }>(ALERT_CHANNELS_QUERY)
      return data.alertChannels
    },
  })
}

export function useAlertRules() {
  return useQuery({
    queryKey: ['alertRules'],
    queryFn: async () => {
      const data = await graphqlClient.request<{ alertRules: AlertRule[] }>(
        ALERT_RULES_QUERY,
      )
      return data.alertRules
    },
  })
}

// --- Status Pages ----------------------------------------------------------

export type StatusPage = {
  id: string
  name: string
  slug: string
  headline: string | null
  visibility: string
  createdAt: string
  updatedAt: string
  workspaceId: string
  projectId: string | null
}

const STATUS_PAGES_QUERY = gql`
  query StatusPages {
    statusPages {
      id
      name
      slug
      headline
      visibility
      workspaceId
      projectId
    }
  }
`

export function useStatusPages() {
  return useQuery({
    queryKey: ['statusPages'],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        statusPages: StatusPage[]
      }>(STATUS_PAGES_QUERY)
      return data.statusPages
    },
  })
}

// --- Errors / Traces -------------------------------------------------------

export type ErrorGroupStatus = 'OPEN' | 'RESOLVED' | 'IGNORED'

export type ErrorGroup = {
  id: string
  fingerprint: string
  title: string
  status: ErrorGroupStatus
  occurrenceCount: number
  firstSeenAt: string
  lastSeenAt: string
  projectId: string
  environmentId: string
  serviceId: string | null
  environmentName: string
  serviceName: string | null
}

const ERROR_GROUPS_QUERY = gql`
  query ErrorGroups($projectSlug: String, $environmentKey: String, $serviceId: String, $limit: Int) {
    errorGroups(projectSlug: $projectSlug, environmentKey: $environmentKey, serviceId: $serviceId, limit: $limit) {
      id
      fingerprint
      title
      status
      occurrenceCount
      firstSeenAt
      lastSeenAt
      projectId
      environmentId
      serviceId
      environmentName
      serviceName
    }
  }
`

export function useErrorGroups(projectSlug?: string, environmentKey?: string) {
  return useQuery({
    queryKey: ['errorGroups', projectSlug ?? null, environmentKey ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{ errorGroups: ErrorGroup[] }>(
        ERROR_GROUPS_QUERY,
        { projectSlug, environmentKey },
      )
      return data.errorGroups
    },
    refetchInterval: 15_000,
  })
}

// --- Deployments -----------------------------------------------------------

export type DeploymentStatus =
  | 'IN_PROGRESS'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'ROLLED_BACK'

export type Deployment = {
  id: string
  version: string
  status: DeploymentStatus
  description: string | null
  deployedBy: string | null
  deployedAt: string
  environmentName: string
  serviceName: string | null
}

export type RecordDeploymentInput = {
  environmentId: string
  serviceId?: string
  version: string
  status?: DeploymentStatus
  description?: string
  deployedBy?: string
}

const DEPLOYMENTS_QUERY = gql`
  query Deployments(
    $environmentKey: String
    $projectSlug: String
    $limit: Int
  ) {
    deployments(
      environmentKey: $environmentKey
      projectSlug: $projectSlug
      limit: $limit
    ) {
      id
      version
      status
      description
      deployedBy
      deployedAt
      environmentName
      serviceName
    }
  }
`

const RECORD_DEPLOYMENT = gql`
  mutation RecordDeployment($input: RecordDeploymentInput!) {
    recordDeployment(input: $input) {
      id
      version
      status
      environmentName
      serviceName
      deployedAt
    }
  }
`

export function useDeployments(limit?: number) {
  return useQuery({
    queryKey: ['deployments', limit ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{ deployments: Deployment[] }>(
        DEPLOYMENTS_QUERY,
        { limit },
      )
      return data.deployments
    },
  })
}

export function useRecordDeployment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordDeploymentInput) => {
      const data = await graphqlClient.request<{
        recordDeployment: Deployment
      }>(RECORD_DEPLOYMENT, { input })
      return data.recordDeployment
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
  })
}

// --- API Keys -------------------------------------------------------------

export type ApiKey = {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  isRevoked: boolean
  createdAt: string
  projectId: string
}

export type ApiKeyWithSecret = ApiKey & { key: string }

export type CreateApiKeyInput = {
  projectId: string
  name: string
  expiresAt?: string
}

const API_KEYS_QUERY = gql`
  query ApiKeys($projectId: String!) {
    apiKeys(projectId: $projectId) {
      id
      name
      prefix
      lastUsedAt
      expiresAt
      isRevoked
      createdAt
      projectId
    }
  }
`

const CREATE_API_KEY = gql`
  mutation CreateApiKey($input: CreateApiKeyInput!) {
    createApiKey(input: $input) {
      id
      name
      prefix
      key
      expiresAt
      isRevoked
      createdAt
      projectId
    }
  }
`

const REVOKE_API_KEY = gql`
  mutation RevokeApiKey($input: RevokeApiKeyInput!) {
    revokeApiKey(input: $input) {
      id
      name
      prefix
      isRevoked
      projectId
    }
  }
`

export function useApiKeys(projectId: string) {
  return useQuery({
    queryKey: ['apiKeys', projectId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ apiKeys: ApiKey[] }>(
        API_KEYS_QUERY,
        { projectId },
      )
      return data.apiKeys
    },
    enabled: !!projectId,
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateApiKeyInput) => {
      const data = await graphqlClient.request<{ createApiKey: ApiKeyWithSecret }>(
        CREATE_API_KEY,
        { input },
      )
      return data.createApiKey
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['apiKeys', result.projectId] })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; projectId: string }) => {
      const data = await graphqlClient.request<{ revokeApiKey: ApiKey }>(
        REVOKE_API_KEY,
        { input: { id: input.id } },
      )
      return data.revokeApiKey
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['apiKeys', vars.projectId] })
    },
  })
}

// --- Wired-up missing mutations ------------------------------------------

export type UpdateProjectInput = {
  id: string
  name?: string
}

const UPDATE_PROJECT = gql`
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) { id name slug workspaceId }
  }
`

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const data = await graphqlClient.request<{ updateProject: Project }>(
        UPDATE_PROJECT,
        { input },
      )
      return data.updateProject
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

const DELETE_PROJECT = gql`
  mutation DeleteProject($id: String!) {
    deleteProject(id: $id)
  }
`

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await graphqlClient.request<{ deleteProject: boolean }>(
        DELETE_PROJECT,
        { id },
      )
      return data.deleteProject
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export type UpdateEnvironmentInput = {
  id: string
  name?: string
  color?: string
}

const UPDATE_ENVIRONMENT = gql`
  mutation UpdateEnvironment($input: UpdateEnvironmentInput!) {
    updateEnvironment(input: $input) { id name key color projectId }
  }
`

const DELETE_ENVIRONMENT = gql`
  mutation DeleteEnvironment($id: String!) {
    deleteEnvironment(id: $id)
  }
`

export function useUpdateEnvironment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateEnvironmentInput) => {
      const data = await graphqlClient.request<{ updateEnvironment: Environment }>(
        UPDATE_ENVIRONMENT,
        { input },
      )
      return data.updateEnvironment
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['environments'] })
    },
  })
}

export function useDeleteEnvironment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await graphqlClient.request<{ deleteEnvironment: boolean }>(
        DELETE_ENVIRONMENT,
        { id },
      )
      return data.deleteEnvironment
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['environments'] })
    },
  })
}

export type UpdateServiceInput = {
  id: string
  name?: string
  description?: string
}

const UPDATE_SERVICE = gql`
  mutation UpdateService($input: UpdateServiceInput!) {
    updateService(input: $input) { id name slug description projectId }
  }
`

const DELETE_SERVICE = gql`
  mutation DeleteService($id: String!) {
    deleteService(id: $id)
  }
`

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateServiceInput) => {
      const data = await graphqlClient.request<{ updateService: unknown }>(
        UPDATE_SERVICE,
        { input },
      )
      return data.updateService
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await graphqlClient.request<{ deleteService: boolean }>(
        DELETE_SERVICE,
        { id },
      )
      return data.deleteService
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

// --- Delete Workspace -------------------------------------------------------

const DELETE_WORKSPACE = gql`
  mutation DeleteWorkspace($id: String!) {
    deleteWorkspace(id: $id)
  }
`

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await graphqlClient.request<{ deleteWorkspace: boolean }>(
        DELETE_WORKSPACE,
        { id },
      )
      return data.deleteWorkspace
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

// --- Error Events ----------------------------------------------------------

export type ErrorEvent = {
  id: string
  eventKey: string
  message: string
  stack: string | null
  release: string | null
  metadata: string | null
  occurredAt: string
  errorGroupId: string
}

const ERROR_EVENTS_QUERY = gql`
  query ErrorEvents($groupId: String!) {
    errorEvents(groupId: $groupId) {
      id
      eventKey
      message
      stack
      release
      occurredAt
      errorGroupId
    }
  }
`

export function useErrorEvents(groupId: string) {
  return useQuery({
    queryKey: ['errorEvents', groupId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ errorEvents: ErrorEvent[] }>(
        ERROR_EVENTS_QUERY,
        { groupId },
      )
      return data.errorEvents
    },
    enabled: !!groupId,
  })
}

// --- Update Error Group Status ----------------------------------------------

const UPDATE_ERROR_GROUP_STATUS = gql`
  mutation UpdateErrorGroupStatus($input: UpdateErrorGroupStatusInput!) {
    updateErrorGroupStatus(input: $input) {
      id
      fingerprint
      title
      status
      occurrenceCount
      firstSeenAt
      lastSeenAt
      projectId
      environmentId
      serviceId
      environmentName
      serviceName
    }
  }
`

export function useUpdateErrorGroupStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; status: string }) => {
      const data = await graphqlClient.request<{
        updateErrorGroupStatus: ErrorGroup
      }>(UPDATE_ERROR_GROUP_STATUS, { input })
      return data.updateErrorGroupStatus
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['errorGroups'] })
    },
  })
}

// --- Incidents CRUD ---------------------------------------------------------

const CREATE_INCIDENT = gql`
  mutation CreateIncident($input: CreateIncidentInput!) {
    createIncident(input: $input) {
      id
      title
      summary
      severity
      status
      startedAt
      resolvedAt
      createdAt
      workspaceId
      projectId
      environmentId
      serviceId
      ownerUserId
    }
  }
`

const UPDATE_INCIDENT = gql`
  mutation UpdateIncident($input: UpdateIncidentInput!) {
    updateIncident(input: $input) {
      id
      title
      summary
      severity
      status
      startedAt
      resolvedAt
      createdAt
      workspaceId
      projectId
      environmentId
      serviceId
      ownerUserId
    }
  }
`

export function useCreateIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string
      severity: string
      summary?: string
      workspaceId: string
      projectId: string
    }) => {
      const data = await graphqlClient.request<{ createIncident: Incident }>(
        CREATE_INCIDENT,
        { input },
      )
      return data.createIncident
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })
}

export function useUpdateIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; status?: string; summary?: string }) => {
      const data = await graphqlClient.request<{ updateIncident: Incident }>(
        UPDATE_INCIDENT,
        { input },
      )
      return data.updateIncident
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })
}

// --- Alert Channels CRUD ---------------------------------------------------

const CREATE_ALERT_CHANNEL = gql`
  mutation CreateAlertChannel($input: CreateAlertChannelInput!) {
    createAlertChannel(input: $input) {
      id
      name
      type
      destination
      secretRef
      isEnabled
      workspaceId
    }
  }
`

const UPDATE_ALERT_CHANNEL = gql`
  mutation UpdateAlertChannel($input: UpdateAlertChannelInput!) {
    updateAlertChannel(input: $input) {
      id
      name
      type
      destination
      secretRef
      isEnabled
      workspaceId
    }
  }
`

const DELETE_ALERT_CHANNEL = gql`
  mutation DeleteAlertChannel($id: String!) {
    deleteAlertChannel(id: $id) {
      id
    }
  }
`

export function useCreateAlertChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      type: string
      destination: string
      workspaceId: string
    }) => {
      const data = await graphqlClient.request<{
        createAlertChannel: AlertChannel
      }>(CREATE_ALERT_CHANNEL, { input })
      return data.createAlertChannel
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertChannels'] })
    },
  })
}

export function useUpdateAlertChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      name?: string
      destination?: string
      isEnabled?: boolean
    }) => {
      const data = await graphqlClient.request<{
        updateAlertChannel: AlertChannel
      }>(UPDATE_ALERT_CHANNEL, { input })
      return data.updateAlertChannel
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertChannels'] })
    },
  })
}

export function useDeleteAlertChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await graphqlClient.request<{ deleteAlertChannel: AlertChannel }>(
        DELETE_ALERT_CHANNEL,
        { id },
      )
      return data.deleteAlertChannel
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertChannels'] })
    },
  })
}

// --- Alert Rules CRUD -------------------------------------------------------

const CREATE_ALERT_RULE = gql`
  mutation CreateAlertRule($input: CreateAlertRuleInput!) {
    createAlertRule(input: $input) {
      id
      name
      triggerType
      minimumSeverity
      isEnabled
      workspaceId
      projectId
      environmentId
      serviceId
      alertChannelId
    }
  }
`

const UPDATE_ALERT_RULE = gql`
  mutation UpdateAlertRule($input: UpdateAlertRuleInput!) {
    updateAlertRule(input: $input) {
      id
      name
      triggerType
      minimumSeverity
      isEnabled
      workspaceId
      projectId
      environmentId
      serviceId
      alertChannelId
    }
  }
`

const DELETE_ALERT_RULE = gql`
  mutation DeleteAlertRule($id: String!) {
    deleteAlertRule(id: $id) {
      id
    }
  }
`

export function useCreateAlertRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      triggerType: string
      workspaceId: string
      alertChannelId: string
      minimumSeverity?: string
    }) => {
      const data = await graphqlClient.request<{
        createAlertRule: AlertRule
      }>(CREATE_ALERT_RULE, { input })
      return data.createAlertRule
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertRules'] })
    },
  })
}

export function useUpdateAlertRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      name?: string
      triggerType?: string
      minimumSeverity?: string
      isEnabled?: boolean
    }) => {
      const data = await graphqlClient.request<{
        updateAlertRule: AlertRule
      }>(UPDATE_ALERT_RULE, { input })
      return data.updateAlertRule
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertRules'] })
    },
  })
}

export function useDeleteAlertRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await graphqlClient.request<{ deleteAlertRule: AlertRule }>(
        DELETE_ALERT_RULE,
        { id },
      )
      return data.deleteAlertRule
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertRules'] })
    },
  })
}

// --- Status Pages CRUD ------------------------------------------------------

const CREATE_STATUS_PAGE = gql`
  mutation CreateStatusPage($input: CreateStatusPageInput!) {
    createStatusPage(input: $input) {
      id
      name
      slug
      headline
      visibility
      workspaceId
      projectId
    }
  }
`

const DELETE_STATUS_PAGE = gql`
  mutation DeleteStatusPage($id: String!) {
    deleteStatusPage(id: $id) {
      id
    }
  }
`

export function useCreateStatusPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      headline?: string
      workspaceId: string
    }) => {
      const data = await graphqlClient.request<{
        createStatusPage: StatusPage
      }>(CREATE_STATUS_PAGE, { input })
      return data.createStatusPage
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['statusPages'] })
    },
  })
}

export function useDeleteStatusPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await graphqlClient.request<{ deleteStatusPage: StatusPage }>(
        DELETE_STATUS_PAGE,
        { id },
      )
      return data.deleteStatusPage
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['statusPages'] })
    },
  })
}

// --- Members ---------------------------------------------------------------

export type MemberUser = {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
}

export type Member = {
  id: string
  role: string
  user: MemberUser
}

const MEMBERS_QUERY = gql`
  query Members($workspaceId: String!) {
    members(workspaceId: $workspaceId) {
      id
      role
      user {
        id
        email
        fullName
        avatarUrl
      }
    }
  }
`

export function useMembers(workspaceId: string) {
  return useQuery({
    queryKey: ['members', workspaceId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ members: Member[] }>(
        MEMBERS_QUERY,
        { workspaceId },
      )
      return data.members
    },
    enabled: !!workspaceId,
  })
}
