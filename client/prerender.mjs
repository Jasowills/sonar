import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dist = new URL('./dist', import.meta.url).pathname
const index = readFileSync(join(dist, 'index.html'), 'utf-8')

const routes = [
  {
    path: '/',
    title: 'Sonar — observability for SaaS teams',
    description:
      'Sonar combines uptime monitoring, error tracing, alert routing, incident response, and status pages for small SaaS teams.',
  },
  {
    path: '/docs',
    title: 'Documentation — Sonar',
    description:
      'Sonar documentation — SDK reference, API guides, and integration tutorials for uptime monitoring and error tracing.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy — Sonar',
    description:
      'Sonar privacy policy — how we collect, use, and protect your data.',
  },
  {
    path: '/terms',
    title: 'Terms of Service — Sonar',
    description:
      'Sonar terms of service — rules and guidelines for using our platform.',
  },
]

for (const route of routes) {
  const html = index
    .replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
    .replace(
      /<meta name="description" content=".*?"/,
      `<meta name="description" content="${route.description}"`,
    )

  // Create nested directories (e.g., /docs → dist/docs/index.html)
  const dir = join(dist, route.path === '/' ? '' : route.path)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const outputPath = join(dir, 'index.html')
  writeFileSync(outputPath, html)
  console.log(`  → ${outputPath.replace(dist, '')}`)
}
