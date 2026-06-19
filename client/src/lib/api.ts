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
    refetchInterval: 15_000,
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

export type CheckResult = {
  id: string
  state: string
  statusCode: number | null
  latencyMs: number | null
  errorMessage: string | null
  checkedAt: string
  monitorId: string
}

export type CheckResultsConnection = {
  items: CheckResult[]
  nextCursor: string | null
}

const MONITOR_QUERY = gql`
  query Monitor($id: String!) {
    monitor(id: $id) {
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

const CHECK_RESULTS_QUERY = gql`
  query CheckResults($monitorId: String!, $limit: Int, $cursor: String) {
    checkResults(monitorId: $monitorId, limit: $limit, cursor: $cursor) {
      items {
        id
        state
        statusCode
        latencyMs
        errorMessage
        checkedAt
        monitorId
      }
      nextCursor
    }
  }
`

export function useMonitor(id: string) {
  return useQuery({
    queryKey: ['monitor', id],
    queryFn: async () => {
      const data = await graphqlClient.request<{ monitor: Monitor }>(
        MONITOR_QUERY,
        { id },
      )
      return data.monitor
    },
    enabled: !!id,
  })
}

export function useCheckResults(monitorId: string, limit = 50) {
  return useQuery({
    queryKey: ['checkResults', monitorId, limit],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        checkResults: CheckResultsConnection
      }>(CHECK_RESULTS_QUERY, { monitorId, limit })
      return data.checkResults
    },
    refetchInterval: 15_000,
    enabled: !!monitorId,
  })
}

export function useLoadMoreCheckResults(monitorId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (cursor: string) => {
      const data = await graphqlClient.request<{
        checkResults: CheckResultsConnection
      }>(CHECK_RESULTS_QUERY, { monitorId, limit: 50, cursor })
      return data.checkResults
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['checkResults', monitorId, 50], (old?: CheckResultsConnection) => {
        if (!old) return newData
        return {
          items: [...old.items, ...newData.items],
          nextCursor: newData.nextCursor,
        }
      })
    },
  })
  return mutation
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
  monitorId: string | null
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
  logoUrl: string | null
  theme: string
  darkLogoUrl: string | null
  logoLinkUrl: string | null
  createdAt: string
  updatedAt: string
  workspaceId: string
  workspaceSlug: string
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
      logoUrl
      workspaceId
      workspaceSlug
      projectId
      createdAt
      updatedAt
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
  query ErrorGroups($projectSlug: String, $environmentKey: String, $serviceId: String, $limit: Int, $cursor: String) {
    errorGroups(projectSlug: $projectSlug, environmentKey: $environmentKey, serviceId: $serviceId, limit: $limit, cursor: $cursor) {
      items {
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
      nextCursor
    }
  }
`

export type ErrorGroupsConnection = {
  items: ErrorGroup[]
  nextCursor: string | null
}

export function useErrorGroups(projectSlug?: string, environmentKey?: string) {
  return useQuery({
    queryKey: ['errorGroups', projectSlug ?? null, environmentKey ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{ errorGroups: ErrorGroupsConnection }>(
        ERROR_GROUPS_QUERY,
        { projectSlug, environmentKey },
      )
      return data.errorGroups.items
    },
    refetchInterval: 15_000,
  })
}

export function useErrorGroupsConnection(projectSlug?: string, environmentKey?: string) {
  return useQuery({
    queryKey: ['errorGroupsConnection', projectSlug ?? null, environmentKey ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{ errorGroups: ErrorGroupsConnection }>(
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
    $cursor: String
  ) {
    deployments(
      environmentKey: $environmentKey
      projectSlug: $projectSlug
      limit: $limit
      cursor: $cursor
    ) {
      items {
        id
        version
        status
        description
        deployedBy
        environmentName
        serviceName
        deployedAt
      }
      nextCursor
    }
  }
`

export type DeploymentsConnection = {
  items: Deployment[]
  nextCursor: string | null
}

export function useDeployments(limit?: number) {
  return useQuery({
    queryKey: ['deployments', limit ?? null],
    queryFn: async () => {
      const data = await graphqlClient.request<{ deployments: DeploymentsConnection }>(
        DEPLOYMENTS_QUERY,
        { limit },
      )
      return data.deployments.items
    },
  })
}

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
  query ErrorEvents($groupId: String!, $limit: Int, $cursor: String) {
    errorEvents(groupId: $groupId, limit: $limit, cursor: $cursor) {
      items {
        id
        eventKey
        message
        stack
        release
        occurredAt
        errorGroupId
      }
      nextCursor
    }
  }
`

export type ErrorEventsConnection = {
  items: ErrorEvent[]
  nextCursor: string | null
}

export function useErrorEvents(groupId: string) {
  return useQuery({
    queryKey: ['errorEvents', groupId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ errorEvents: ErrorEventsConnection }>(
        ERROR_EVENTS_QUERY,
        { groupId },
      )
      return data.errorEvents.items
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

export type IncidentUpdate = {
  id: string
  kind: string
  body: string
  createdAt: string
  actorUserId: string | null
  incidentId: string
}

const INCIDENT_UPDATES_QUERY = gql`
  query IncidentUpdates($incidentId: String!) {
    incidentUpdates(incidentId: $incidentId) {
      id
      kind
      body
      createdAt
      actorUserId
      incidentId
    }
  }
`

export function useIncidentUpdates(incidentId: string) {
  return useQuery({
    queryKey: ['incidentUpdates', incidentId],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        incidentUpdates: IncidentUpdate[]
      }>(INCIDENT_UPDATES_QUERY, { incidentId })
      return data.incidentUpdates
    },
    enabled: !!incidentId,
  })
}

const RESOLVE_INCIDENT = gql`
  mutation ResolveIncident($input: ResolveIncidentInput!) {
    resolveIncident(input: $input) {
      id title summary severity status startedAt resolvedAt createdAt
    }
  }
`

const ADD_INCIDENT_UPDATE = gql`
  mutation AddIncidentUpdate($input: AddIncidentUpdateInput!) {
    addIncidentUpdate(input: $input) {
      id kind body createdAt actorUserId incidentId
    }
  }
`

export function useResolveIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; summary?: string }) => {
      const data = await graphqlClient.request<{ resolveIncident: Incident }>(
        RESOLVE_INCIDENT,
        { input },
      )
      return data.resolveIncident
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['incidents'] })
      void queryClient.invalidateQueries({ queryKey: ['incidentUpdates'] })
    },
  })
}

export function useAddIncidentUpdate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      incidentId: string
      kind: string
      body: string
    }) => {
      const data = await graphqlClient.request<{
        addIncidentUpdate: IncidentUpdate
      }>(ADD_INCIDENT_UPDATE, { input })
      return data.addIncidentUpdate
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['incidentUpdates', vars.incidentId],
      })
      void queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })
}

const DELETE_INCIDENT = gql`
  mutation DeleteIncident($id: String!) {
    deleteIncident(id: $id)
  }
`

export function useDeleteIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await graphqlClient.request<{ deleteIncident: boolean }>(
        DELETE_INCIDENT,
        { id },
      )
      return data.deleteIncident
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
      workspaceSlug
      projectId
    }
  }
`

const DELETE_STATUS_PAGE = gql`
  mutation DeleteStatusPage($id: String!) {
    deleteStatusPage(id: $id)
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
      await graphqlClient.request<{ deleteStatusPage: boolean }>(
        DELETE_STATUS_PAGE,
        { id },
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['statusPages'] })
    },
  })
}

// --- Status Page Detail & Service Management --------------------------------

export type ServiceHealth = {
  id: string
  serviceId: string
  name: string
  displayName: string | null
  groupName: string | null
  isVisible: boolean
  status: string
  latencyMs: number | null
  sortOrder: number
}

export type StatusPageDetail = StatusPage & {
  faviconUrl: string | null
  brandColor: string | null
  footerText: string | null
  services: ServiceHealth[]
}

const STATUS_PAGE_QUERY = gql`
  query StatusPage($id: String!) {
    statusPage(id: $id) {
      id name slug headline visibility logoUrl faviconUrl brandColor footerText theme darkLogoUrl logoLinkUrl
      createdAt updatedAt workspaceId workspaceSlug projectId
      services {
        id serviceId name displayName groupName isVisible status latencyMs sortOrder
      }
    }
  }
`

const STATUS_PAGE_BY_SLUG_QUERY = gql`
  query StatusPageBySlug($workspaceSlug: String!, $slug: String!) {
    statusPageBySlug(workspaceSlug: $workspaceSlug, slug: $slug) {
      id name slug headline visibility logoUrl faviconUrl brandColor footerText theme darkLogoUrl logoLinkUrl
      createdAt updatedAt workspaceId workspaceSlug projectId
      services {
        id serviceId name displayName groupName isVisible status latencyMs sortOrder
      }
    }
  }
`

export function useStatusPage(id: string) {
  return useQuery({
    queryKey: ['statusPage', id],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        statusPage: StatusPageDetail
      }>(STATUS_PAGE_QUERY, { id })
      return data.statusPage
    },
    enabled: !!id,
  })
}

export function useStatusPageBySlug(workspaceSlug: string, slug: string) {
  return useQuery({
    queryKey: ['statusPageBySlug', workspaceSlug, slug],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        statusPageBySlug: StatusPageDetail
      }>(STATUS_PAGE_BY_SLUG_QUERY, { workspaceSlug, slug })
      return data.statusPageBySlug
    },
    enabled: !!workspaceSlug && !!slug,
  })
}

const UPDATE_STATUS_PAGE = gql`
  mutation UpdateStatusPage($input: UpdateStatusPageInput!) {
    updateStatusPage(input: $input) {
      id name slug headline visibility logoUrl faviconUrl brandColor footerText theme darkLogoUrl logoLinkUrl
    }
  }
`

const ADD_STATUS_PAGE_SERVICE = gql`
  mutation AddStatusPageService($input: AddStatusPageServiceInput!) {
    addStatusPageService(input: $input)
  }
`

const REMOVE_STATUS_PAGE_SERVICE = gql`
  mutation RemoveStatusPageService($input: RemoveStatusPageServiceInput!) {
    removeStatusPageService(input: $input)
  }
`

const UPDATE_STATUS_PAGE_SERVICE = gql`
  mutation UpdateStatusPageService($input: UpdateStatusPageServiceInput!) {
    updateStatusPageService(input: $input)
  }
`

export function useUpdateStatusPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      name?: string
      headline?: string
      visibility?: string
      logoUrl?: string | null
      faviconUrl?: string | null
      brandColor?: string | null
      footerText?: string | null
      darkLogoUrl?: string | null
      logoLinkUrl?: string | null
      theme?: string
    }) => {
      const data = await graphqlClient.request<{
        updateStatusPage: StatusPage
      }>(UPDATE_STATUS_PAGE, { input })
      return data.updateStatusPage
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['statusPages'] })
      void queryClient.invalidateQueries({ queryKey: ['statusPage'] })
    },
  })
}

export function useUpdateStatusPageService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      statusPageId: string
      serviceId: string
      displayName?: string | null
      sortOrder?: number | null
      groupName?: string | null
      isVisible?: boolean | null
    }) => {
      const data = await graphqlClient.request<{
        updateStatusPageService: boolean
      }>(UPDATE_STATUS_PAGE_SERVICE, { input })
      return data.updateStatusPageService
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['statusPage', vars.statusPageId],
      })
    },
  })
}

export function useAddStatusPageService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      statusPageId: string
      serviceId: string
      displayName?: string
    }) => {
      const data = await graphqlClient.request<{
        addStatusPageService: boolean
      }>(ADD_STATUS_PAGE_SERVICE, { input })
      return data.addStatusPageService
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['statusPage', vars.statusPageId],
      })
    },
  })
}

export function useRemoveStatusPageService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      statusPageId: string
      serviceId: string
    }) => {
      const data = await graphqlClient.request<{
        removeStatusPageService: boolean
      }>(REMOVE_STATUS_PAGE_SERVICE, { input })
      return data.removeStatusPageService
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['statusPage', vars.statusPageId],
      })
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

// --- Analytics --------------------------------------------------------------

export type AnalyticsOverview = {
  totalPageViews: number
  uniqueVisitors: number
  bounceRate: number
  avgSessionDuration: number | null
  topPages: Array<{ url: string; views: number; uniqueVisitors: number }>
}

export type PageViewTimeSeriesPoint = {
  date: string
  count: number
}

export type AnalyticsSession = {
  id: string
  visitorId: string | null
  projectId: string
  startUrl: string
  referrer: string | null
  userAgent: string | null
  ip: string | null
  country: string | null
  pageViews: number
  eventCount: number
  duration: number | null
  isBounce: boolean
  startedAt: string
  lastActivityAt: string
  frustrationScore: number | null
  interestingnessScore: number | null
  userIntent: string | null
  economicImpact: number | null
  hasFrustrationSignals: boolean
  hasFormInteraction: boolean
  hasErrors: boolean
  totalErrors: number
  totalRageClicks: number
  totalDeadClicks: number
  browser: string | null
  os: string | null
  device: string | null
  activeTime: number | null
  crashDetected: boolean
  videoUrl: string | null
}

export type AnalyticsEvent = {
  id: string
  type: string
  category: string | null
  name: string | null
  url: string
  referrer: string | null
  userAgent: string | null
  viewportWidth: number | null
  viewportHeight: number | null
  screenWidth: number | null
  screenHeight: number | null
  payload: string | null
  projectId: string
  sessionId: string | null
  visitorId: string | null
  severity: number | null
  fingerprint: string | null
  timestamp: string
}

export type SourceResult = {
  referrer: string
  count: number
}

export type EventTypeDist = {
  type: string
  count: number
}

const ANALYTICS_OVERVIEW_QUERY = gql`
  query AnalyticsOverview($projectId: String!) {
    analyticsOverview(projectId: $projectId) {
      totalPageViews
      uniqueVisitors
      bounceRate
      avgSessionDuration
      topPages {
        url
        views
        uniqueVisitors
      }
      totalRageClicks
      totalDeadClicks
      totalErrors
    }
  }
`

const ANALYTICS_PAGE_VIEWS_QUERY = gql`
  query AnalyticsPageViews($projectId: String!, $from: String, $to: String) {
    analyticsPageViews(projectId: $projectId, from: $from, to: $to) {
      date
      count
    }
  }
`

const ANALYTICS_SESSIONS_QUERY = gql`
  query AnalyticsSessions($projectId: String!, $limit: Int) {
    analyticsSessions(projectId: $projectId, limit: $limit) {
      id
      visitorId
      startUrl
      referrer
      userAgent
      pageViews
      eventCount
      duration
      isBounce
      startedAt
      frustrationScore
      interestingnessScore
      userIntent
      hasFrustrationSignals
      hasErrors
      totalErrors
      totalRageClicks
      totalDeadClicks
      browser
      os
      device
      videoUrl
    }
  }
`

const ANALYTICS_SESSION_QUERY = gql`
  query AnalyticsSession($id: String!) {
    analyticsSession(id: $id) {
      id
      visitorId
      startUrl
      referrer
      userAgent
      pageViews
      eventCount
      duration
      isBounce
      startedAt
      lastActivityAt
      frustrationScore
      interestingnessScore
      userIntent
      economicImpact
      hasFrustrationSignals
      hasFormInteraction
      hasErrors
      totalErrors
      totalRageClicks
      totalDeadClicks
      browser
      os
      device
      activeTime
      crashDetected
      videoUrl
    }
  }
`

const ANALYTICS_SESSION_EVENTS_QUERY = gql`
  query AnalyticsSessionEvents($sessionId: String!) {
    analyticsSessionEvents(sessionId: $sessionId) {
      id
      type
      category
      name
      url
      referrer
      userAgent
      viewportWidth
      viewportHeight
      payload
      severity
      fingerprint
      timestamp
    }
  }
`

const ANALYTICS_TOP_PAGES_QUERY = gql`
  query AnalyticsTopPages($projectId: String!, $limit: Int) {
    analyticsTopPages(projectId: $projectId, limit: $limit) {
      url
      views
      uniqueVisitors
    }
  }
`

const ANALYTICS_SOURCES_QUERY = gql`
  query AnalyticsSources($projectId: String!) {
    analyticsSources(projectId: $projectId) {
      referrer
      count
    }
  }
`

const ANALYTICS_EVENT_TYPES_QUERY = gql`
  query AnalyticsEventTypes($projectId: String!) {
    analyticsEventTypes(projectId: $projectId) {
      type
      count
    }
  }
`

export function useAnalyticsOverview(projectId?: string) {
  return useQuery({
    queryKey: ['analyticsOverview', projectId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyticsOverview: AnalyticsOverview }>(
        ANALYTICS_OVERVIEW_QUERY,
        { projectId },
      )
      return data.analyticsOverview
    },
    enabled: !!projectId,
  })
}

export function useAnalyticsPageViews(projectId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['analyticsPageViews', projectId, from, to],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyticsPageViews: PageViewTimeSeriesPoint[] }>(
        ANALYTICS_PAGE_VIEWS_QUERY,
        { projectId, from, to },
      )
      return data.analyticsPageViews
    },
    enabled: !!projectId,
  })
}

export function useAnalyticsSessions(projectId?: string, limit = 50) {
  return useQuery({
    queryKey: ['analyticsSessions', projectId, limit],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyticsSessions: AnalyticsSession[] }>(
        ANALYTICS_SESSIONS_QUERY,
        { projectId, limit },
      )
      return data.analyticsSessions
    },
    enabled: !!projectId,
  })
}

export function useAnalyticsSession(id?: string) {
  return useQuery({
    queryKey: ['analyticsSession', id],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyticsSession: AnalyticsSession }>(
        ANALYTICS_SESSION_QUERY,
        { id },
      )
      return data.analyticsSession
    },
    enabled: !!id,
  })
}

export function useAnalyticsSessionEvents(sessionId?: string) {
  return useQuery({
    queryKey: ['analyticsSessionEvents', sessionId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyticsSessionEvents: AnalyticsEvent[] }>(
        ANALYTICS_SESSION_EVENTS_QUERY,
        { sessionId },
      )
      return data.analyticsSessionEvents
    },
    enabled: !!sessionId,
  })
}

export function useAnalyticsTopPages(projectId?: string, limit = 10) {
  return useQuery({
    queryKey: ['analyticsTopPages', projectId, limit],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyticsTopPages: AnalyticsEvent[] }>(
        ANALYTICS_TOP_PAGES_QUERY,
        { projectId, limit },
      )
      return data.analyticsTopPages
    },
    enabled: !!projectId,
  })
}

export function useAnalyticsSources(projectId?: string) {
  return useQuery({
    queryKey: ['analyticsSources', projectId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyticsSources: SourceResult[] }>(
        ANALYTICS_SOURCES_QUERY,
        { projectId },
      )
      return data.analyticsSources
    },
    enabled: !!projectId,
  })
}

export function useAnalyticsEventTypes(projectId?: string) {
  return useQuery({
    queryKey: ['analyticsEventTypes', projectId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyticsEventTypes: EventTypeDist[] }>(
        ANALYTICS_EVENT_TYPES_QUERY,
        { projectId },
      )
      return data.analyticsEventTypes
    },
    enabled: !!projectId,
  })
}

// ─── AI Features ─────────────────────────────────────────────────────────────

export type HealthTrendDirection = 'IMPROVING' | 'DECLINING' | 'STABLE'
export type InsightSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export type AIErrorSummary = {
  errorGroupId: string
  summary: string
  suggestedFix: string | null
  confidence: number | null
  createdAt: string
}

export type DeploymentRef = {
  id: string
  version: string
  environmentName: string
  serviceName: string | null
  deployedAt: string
  deployedBy: string
}

export type IncidentCorrelation = {
  incidentId: string
  narrative: string
  relatedDeployments: DeploymentRef[]
  relatedErrorGroups: string[] | null
}

export type HealthTrend = {
  monitorId: string
  trend: HealthTrendDirection
  slope: number
  avgLatencyMs: number | null
  failureRate: number | null
  projectedHoursToCritical: number | null
  confidence: number | null
  dataPoints: number | null
  analyzedAt: string
}

export type AISessionInsight = {
  sessionId: string
  summary: string
  keyMoments: string[]
  frustrationHotspots: string[]
  recommendation: string | null
}

export type AIAnalyticsInsight = {
  title: string
  description: string
  severity: InsightSeverity
  metric: string | null
  value: number | null
}

export type IncidentRootCause = {
  incidentId: string
  narrative: string
  possibleCauses: string[]
  suggestions: string[]
  relatedDeploymentId: string | null
}

export type AnalyticsReport = {
  workspaceId: string
  executiveSummary: string
  trafficInsights: string[]
  behaviorInsights: string[]
  frustrationHotspots: string[]
  recommendations: string[]
  periodLabel: string
  analyzedAt: string
}

export type AlertTriage = {
  alertRuleId: string
  context: string | null
  frequency: string | null
  suggestion: string | null
}

const ERROR_SUMMARY_QUERY = gql`
  query SummarizeErrorGroup($errorGroupId: ID!) {
    summarizeErrorGroup(errorGroupId: $errorGroupId) {
      errorGroupId
      summary
      suggestedFix
      confidence
      createdAt
    }
  }
`

const INCIDENT_CORRELATION_QUERY = gql`
  query IncidentCorrelation($incidentId: String!) {
    incidentCorrelation(incidentId: $incidentId) {
      incidentId
      narrative
      relatedDeployments {
        id
        version
        environmentName
        serviceName
        deployedAt
        deployedBy
      }
      relatedErrorGroups
    }
  }
`

const MONITOR_HEALTH_TREND_QUERY = gql`
  query MonitorHealthTrend($monitorId: ID!) {
    monitorHealthTrend(monitorId: $monitorId) {
      monitorId
      trend
      slope
      avgLatencyMs
      failureRate
      projectedHoursToCritical
      confidence
      dataPoints
      analyzedAt
    }
  }
`

const ANALYZE_SESSION_QUERY = gql`
  query AnalyzeSession($sessionId: ID!) {
    analyzeSession(sessionId: $sessionId) {
      sessionId
      summary
      keyMoments
      frustrationHotspots
      recommendation
    }
  }
`

const ANALYTICS_INSIGHTS_QUERY = gql`
  query AnalyticsInsights($workspaceId: String!, $timeRange: String) {
    analyticsInsights(workspaceId: $workspaceId, timeRange: $timeRange) {
      title
      description
      severity
      metric
      value
    }
  }
`

const INCIDENT_ROOT_CAUSE_MUTATION = gql`
  mutation GenerateIncidentRootCause($incidentId: String!) {
    generateIncidentRootCause(incidentId: $incidentId) {
      incidentId
      narrative
      possibleCauses
      suggestions
      relatedDeploymentId
    }
  }
`

const ANALYTICS_REPORT_QUERY = gql`
  query GenerateAnalyticsAnalysis($workspaceId: String!, $timeRange: String) {
    generateAnalyticsAnalysis(workspaceId: $workspaceId, timeRange: $timeRange) {
      workspaceId
      executiveSummary
      trafficInsights
      behaviorInsights
      frustrationHotspots
      recommendations
      periodLabel
      analyzedAt
    }
  }
`

const GENERATE_WEEKLY_BRIEF_MUTATION = gql`
  mutation GenerateWeeklyBrief($workspaceId: String!) {
    generateWeeklyBrief(workspaceId: $workspaceId)
  }
`

const ALERT_TRIAGE_QUERY = gql`
  query AlertTriage($alertRuleId: ID!) {
    alertTriage(alertRuleId: $alertRuleId) {
      alertRuleId
      context
      frequency
      suggestion
    }
  }
`

export function useErrorSummary(errorGroupId?: string) {
  return useQuery({
    queryKey: ['errorSummary', errorGroupId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ summarizeErrorGroup: AIErrorSummary }>(
        ERROR_SUMMARY_QUERY,
        { errorGroupId },
      )
      return data.summarizeErrorGroup
    },
    enabled: !!errorGroupId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useIncidentCorrelation(incidentId?: string) {
  return useQuery({
    queryKey: ['incidentCorrelation', incidentId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ incidentCorrelation: IncidentCorrelation }>(
        INCIDENT_CORRELATION_QUERY,
        { incidentId },
      )
      return data.incidentCorrelation
    },
    enabled: !!incidentId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMonitorHealthTrend(monitorId?: string) {
  return useQuery({
    queryKey: ['monitorHealthTrend', monitorId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ monitorHealthTrend: HealthTrend }>(
        MONITOR_HEALTH_TREND_QUERY,
        { monitorId },
      )
      return data.monitorHealthTrend
    },
    enabled: !!monitorId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAnalyzeSession(sessionId?: string) {
  return useQuery({
    queryKey: ['analyzeSession', sessionId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyzeSession: AISessionInsight }>(
        ANALYZE_SESSION_QUERY,
        { sessionId },
      )
      return data.analyzeSession
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAnalyticsInsights(workspaceId?: string, timeRange?: string) {
  return useQuery({
    queryKey: ['analyticsInsights', workspaceId, timeRange],
    queryFn: async () => {
      const data = await graphqlClient.request<{ analyticsInsights: AIAnalyticsInsight[] }>(
        ANALYTICS_INSIGHTS_QUERY,
        { workspaceId, timeRange },
      )
      return data.analyticsInsights
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGenerateIncidentRootCause() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (incidentId: string) => {
      const data = await graphqlClient.request<{ generateIncidentRootCause: IncidentRootCause }>(
        INCIDENT_ROOT_CAUSE_MUTATION,
        { incidentId },
      )
      return data.generateIncidentRootCause
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidentRootCause'] })
    },
  })
}

export function useAnalyticsReport(workspaceId?: string, timeRange?: string) {
  return useQuery({
    queryKey: ['analyticsReport', workspaceId, timeRange],
    queryFn: async () => {
      const data = await graphqlClient.request<{ generateAnalyticsAnalysis: AnalyticsReport }>(
        ANALYTICS_REPORT_QUERY,
        { workspaceId, timeRange },
      )
      return data.generateAnalyticsAnalysis
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGenerateWeeklyBrief() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const data = await graphqlClient.request<{ generateWeeklyBrief: string }>(
        GENERATE_WEEKLY_BRIEF_MUTATION,
        { workspaceId },
      )
      return data.generateWeeklyBrief
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useAlertTriage(alertRuleId?: string) {
  return useQuery({
    queryKey: ['alertTriage', alertRuleId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ alertTriage: AlertTriage }>(
        ALERT_TRIAGE_QUERY,
        { alertRuleId },
      )
      return data.alertTriage
    },
    enabled: !!alertRuleId,
    staleTime: 5 * 60 * 1000,
  })
}
