# sonar-sdk

Official Node.js SDK for [Sonar](https://sonar.app) — error capture, deploy tracking, and uptime monitoring.

## Installation

```bash
npm install sonar-sdk
```

## Usage

```typescript
import Sonar from 'sonar-sdk'

const sonar = new Sonar({
  apiKey: process.env.SONAR_API_KEY!,
  environment: process.env.SONAR_ENVIRONMENT || 'development',
})

// Capture an error
try {
  await processOrder(data)
} catch (err) {
  sonar.captureError(err, {
    fingerprint: 'OrderProcessingError',
    metadata: { orderId: data.id },
  })
}

// Track a deployment
await sonar.recordDeployment({
  version: 'v1.2.3',
  status: 'succeeded',
  description: 'Release candidate 3',
  deployedBy: 'deploy-bot',
})

// Auto-capture uncaught exceptions and rejections
sonar.setupGlobalHandlers()

// Express error middleware
app.use(sonar.middleware())
```

## API

### `new Sonar(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | required | Your Sonar API key |
| `environment` | `string` | required | e.g. `production`, `staging` |
| `release` | `string` | `undefined` | Current release version |
| `endpoint` | `string` | `http://localhost:8080` | API base URL |

### `captureError(error, options?)`

Send an error to Sonar. Errors with the same fingerprint are grouped automatically.

### `recordDeployment(options)`

Record a deployment. Appears on the incident timeline.

### `setupGlobalHandlers()`

Registers `process.on('uncaughtException')` and `process.on('unhandledRejection')` handlers.

### `middleware()`

Returns an Express error-handling middleware function.

## Publishing

```bash
npm run build
npm publish --access public
```
