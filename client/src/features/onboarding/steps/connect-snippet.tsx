export function ConnectSnippet({ projectKey, envKey }: { projectKey: string; envKey: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[var(--text-muted)]">
        Add the Watchdog SDK to your project:
      </p>
      <pre className="border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4 text-xs text-[var(--text-main)] overflow-x-auto">
{`npm install @watchdog/sdk

import { Watchdog } from '@watchdog/sdk'

const watchdog = new Watchdog({
  projectKey: '${projectKey || '<your-project-key>'}',
  envKey: '${envKey || '<your-env-key>'}',
})

// Capture errors
watchdog.captureError(error)

// Record deployments
watchdog.recordDeployment({
  environmentId: 'env-xxx',
  version: 'v1.0.0',
  description: 'Release v1.0.0',
})`}
      </pre>
      <p className="text-xs text-[var(--text-soft)]">
        See the <span className="underline cursor-default">SDK documentation</span> for all configuration options.
      </p>
    </div>
  )
}
