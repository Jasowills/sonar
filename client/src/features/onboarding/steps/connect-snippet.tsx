export function ConnectSnippet({ envKey }: { envKey: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[var(--text-muted)]">
        Add the Sonar SDK to your project:
      </p>
      <pre className="border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4 text-xs text-[var(--text-main)] overflow-x-auto">
{`npm install sonar-sdk

import { Sonar } from 'sonar-sdk'

const sonar = new Sonar({
  apiKey: process.env.SONAR_API_KEY,
  environment: '${envKey || '<your-env-key>'}',
})

// Capture errors
sonar.captureError(error)

// Record deployments
sonar.recordDeployment({
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
