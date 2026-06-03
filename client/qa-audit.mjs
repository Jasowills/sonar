import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

const browser = await chromium.launch({ headless: true })

async function auditPage(path, { auth = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const issues = []

  // Collect console errors
  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // Collect uncaught exceptions
  page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`))

  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    const url = page.url()
    const title = await page.title()

    // Check for 404 or error state
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500))
    const hasErrorText = /not found|error|something went wrong/i.test(bodyText)

    issues.push({ type: 'info', msg: `URL: ${url}` })
    issues.push({ type: 'info', msg: `Title: "${title}"` })

    if (hasErrorText && path !== '/404' && path !== '/*') {
      issues.push({ type: 'warn', msg: 'Page shows error/not-found text' })
    }

    // Check for visible content
    const hasContent = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('#root')
      return main ? main.innerText.trim().length > 0 : false
    })
    if (!hasContent) issues.push({ type: 'warn', msg: 'No visible content in <main>' })

    // Check if page has any interactive elements
    const hasLinks = await page.$('a[href]')
    const hasButtons = await page.$('button')
    if (!hasLinks && !hasButtons) issues.push({ type: 'warn', msg: 'No interactive elements found' })
  } catch (err) {
    issues.push({ type: 'error', msg: `Failed to load: ${err.message}` })
  }

  // Collect console errors
  if (consoleErrors.length > 0) {
    issues.push({ type: 'error', msg: `Console errors (${consoleErrors.length}): ${consoleErrors.slice(0, 5).join(' | ')}` })
  }

  await context.close()
  return { path, issues }
}

async function auditPublicPages() {
  console.log('\n=== PUBLIC PAGES ===')
  const pages = ['/', '/docs', '/privacy', '/terms', '/login']
  const results = []
  for (const p of pages) {
    const r = await auditPage(p)
    results.push(r)
    printResults(r)
  }
  return results
}

async function auditProtectedRoutes() {
  console.log('\n=== PROTECTED ROUTES (should redirect to login) ===')
  const routes = [
    '/app/overview', '/app/monitors', '/app/traces',
    '/app/incidents', '/app/alerts', '/app/status-pages',
    '/app/connections', '/app/settings', '/app',
  ]
  const results = []
  for (const r of routes) {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
    const issues = []
    try {
      await page.goto(`${BASE}${r}`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(1000)
      const url = page.url()
      const redirected = !url.includes(r) && (url.includes('/login') || url.includes('/'))
      issues.push({ type: 'info', msg: `Navigated to ${r} → ${url}` })
      if (redirected) {
        issues.push({ type: 'pass', msg: 'Correctly redirects to login' })
      } else {
        issues.push({ type: 'fail', msg: 'DOES NOT redirect to login — leaks protected content' })
      }
    } catch (err) {
      issues.push({ type: 'error', msg: `Error: ${err.message}` })
    }
    await page.context().close()
    printResults({ path: r, issues })
    results.push({ path: r, issues })
  }
  return results
}

async function auditLoginFlow() {
  console.log('\n=== LOGIN PAGE AUDIT ===')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const issues = []

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    // Check for form elements
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]')
    const passwordInput = await page.$('input[type="password"], input[name="password"]')
    const submitButton = await page.$('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")')

    issues.push({ type: 'info', msg: `Email input: ${!!emailInput}, Password input: ${!!passwordInput}, Submit: ${!!submitButton}` })

    if (!emailInput) issues.push({ type: 'fail', msg: 'No email input field' })
    if (!passwordInput) issues.push({ type: 'fail', msg: 'No password input field' })
    if (!submitButton) issues.push({ type: 'fail', msg: 'No submit button' })

    // Check for register link/option
    const registerLink = await page.$('a[href*="register"], a:has-text("Sign up"), a:has-text("Create"), button:has-text("Register")')
    if (!registerLink) issues.push({ type: 'warn', msg: 'No registration link visible' })

    // Check for Google OAuth button
    const googleBtn = await page.$('button:has-text("Google"), a:has-text("Google")')
    if (googleBtn) {
      issues.push({ type: 'pass', msg: 'Google OAuth button present' })
    } else {
      issues.push({ type: 'warn', msg: 'Google OAuth button not found' })
    }

    // Try submitting with empty fields
    if (submitButton) {
      await submitButton.click()
      await page.waitForTimeout(500)
      const valMsg = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input:invalid')
        return inputs.length > 0 ? `HTML5 validation triggered on ${inputs.length} fields` : 'No HTML5 validation'
      })
      issues.push({ type: 'info', msg: `Empty submit: ${valMsg}` })
    }

    // Try submitting with invalid email
    if (emailInput && passwordInput && submitButton) {
      await emailInput.fill('not-an-email')
      await passwordInput.fill('short')
      await submitButton.click()
      await page.waitForTimeout(500)
      const errDisplay = await page.evaluate(() => {
        const errEl = document.querySelector('[class*="error"], [class*="alert"], [role="alert"]')
        return errEl ? errEl.innerText.slice(0, 200) : 'No error element found'
      })
      issues.push({ type: 'info', msg: `Invalid input submission: ${errDisplay}` })
    }

    // Try SQL injection in email field
    if (emailInput && submitButton) {
      await emailInput.fill("' OR 1=1 --")
      if (passwordInput) await passwordInput.fill("' OR '1'='1")
      await submitButton.click()
      await page.waitForTimeout(500)
      issues.push({ type: 'info', msg: 'SQL injection test submitted (check server logs for errors)' })
    }
  } catch (err) {
    issues.push({ type: 'error', msg: `Login page audit error: ${err.message}` })
  }

  await context.close()
  printResults({ path: '/login', issues })
  return { path: '/login', issues }
}

async function auditLandingPage() {
  console.log('\n=== LANDING PAGE AUDIT ===')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const issues = []

  try {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(2000)

    // Check grain
    const grain = await page.$('.landing-grain')
    issues.push({ type: 'info', msg: `Grain element: ${!!grain}` })

    // Check navigation
    const nav = await page.$('nav, header')
    issues.push({ type: 'info', msg: `Navigation: ${!!nav}` })

    // Check hero section
    const heroHeading = await page.$('h1')
    issues.push({ type: 'info', msg: `Hero heading: ${heroHeading ? await heroHeading.innerText() : 'not found'}` })

    // Check CTA buttons
    const ctas = await page.$$('a[href*="login"], a[href*="sign"], a[href*="get-started"], button:has-text("Get started")')
    issues.push({ type: 'info', msg: `CTA buttons: ${ctas.length}` })

    // Check features section
    const featuresSection = await page.$('#features, section:has(h2)')
    issues.push({ type: 'info', msg: `Features section: ${!!featuresSection}` })

    // Check footer
    const footer = await page.$('footer')
    issues.push({ type: 'info', msg: `Footer: ${!!footer}` })

    // Check for console errors
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    if (consoleErrors.length > 0) {
      issues.push({ type: 'warn', msg: `Console errors: ${consoleErrors.slice(0, 3).join(' | ')}` })
    }

    // Check scroll behavior
    const hasSmoothScroll = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).scrollBehavior === 'smooth'
    })
    issues.push({ type: 'info', msg: `Smooth scroll: ${hasSmoothScroll}` })

    // Check for mobile responsiveness (meta viewport)
    const viewportMeta = await page.$('meta[name="viewport"]')
    issues.push({ type: 'info', msg: `Viewport meta: ${!!viewportMeta}` })

    // Check for lang attribute
    const htmlLang = await page.evaluate(() => document.documentElement.lang)
    issues.push({ type: 'info', msg: `HTML lang: "${htmlLang || 'not set'}"` })
    if (!htmlLang) issues.push({ type: 'warn', msg: 'Missing lang attribute on <html>' })

    // Check dark mode class
    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    issues.push({ type: 'info', msg: `Dark mode: ${hasDark}` })

  } catch (err) {
    issues.push({ type: 'error', msg: `Landing page audit error: ${err.message}` })
  }

  await context.close()
  printResults({ path: '/ (landing)', issues })
  return { path: '/ (landing)', issues }
}

async function auditDocsPage() {
  console.log('\n=== DOCS PAGE AUDIT ===')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const issues = []

  try {
    await page.goto(`${BASE}/docs`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    // Check sidebar navigation
    const sidebar = await page.$('nav, aside')
    issues.push({ type: 'info', msg: `Navigation sidebar: ${!!sidebar}` })

    // Check content
    const content = await page.evaluate(() => document.body.innerText.length)
    issues.push({ type: 'info', msg: `Content length: ${content} chars` })
    if (content < 100) issues.push({ type: 'warn', msg: 'Very little content on docs page' })

    // Check for search
    const search = await page.$('input[type="search"], input[placeholder*="search" i]')
    issues.push({ type: 'info', msg: `Search input: ${!!search}` })

    // Check for code blocks
    const codeBlocks = await page.$$('pre, code')
    issues.push({ type: 'info', msg: `Code blocks: ${codeBlocks.length}` })

  } catch (err) {
    issues.push({ type: 'error', msg: `Docs page audit error: ${err.message}` })
  }

  await context.close()
  printResults({ path: '/docs', issues })
  return { path: '/docs', issues }
}

async function auditSecurity() {
  console.log('\n=== SECURITY AUDIT ===')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const issues = []

  try {
    // Check security headers
    const response = await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
    const headers = response.headers()
    
    const securityHeaders = {
      'content-security-policy': 'Content-Security-Policy',
      'x-content-type-options': 'X-Content-Type-Options',
      'x-frame-options': 'X-Frame-Options',
      'x-xss-protection': 'X-XSS-Protection',
      'strict-transport-security': 'Strict-Transport-Security',
      'referrer-policy': 'Referrer-Policy',
    }
    
    for (const [header, name] of Object.entries(securityHeaders)) {
      if (headers[header]) {
        issues.push({ type: 'pass', msg: `${name} header present` })
      } else {
        issues.push({ type: 'warn', msg: `Missing security header: ${name}` })
      }
    }

    // Check if JWT is exposed in page source or HTML
    const html = await page.evaluate(() => document.querySelector('html')?.outerHTML || '')
    const jwtRegex = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g
    const foundJwts = html.match(jwtRegex)
    if (foundJwts) {
      issues.push({ type: 'fail', msg: `JWT token(s) exposed in HTML: ${foundJwts.length} found` })
    }

    // Check localStorage for token exposure via XSS vector
    await page.evaluate(() => {
      localStorage.setItem('watchdog_token', 'eyJ0ZXN0IjoidGVzdCJ9.test.test')
    })
    const storedToken = await page.evaluate(() => localStorage.getItem('watchdog_token'))
    issues.push({ type: 'info', msg: `localStorage token access: ${storedToken ? 'readable via JS (XSS risk)' : 'not accessible'}` })
    await page.evaluate(() => localStorage.removeItem('watchdog_token'))

    // Check form action URLs (should be relative or same-origin)
    const forms = await page.$$('form')
    for (const form of forms) {
      const action = await form.getAttribute('action')
      if (action && (action.startsWith('http://') || action.startsWith('https://')) && !action.includes('localhost:8080')) {
        issues.push({ type: 'warn', msg: `Form posts to external URL: ${action}` })
      }
    }

    // Check for inline event handlers (XSS vector)
    const inlineHandlers = await page.evaluate(() => {
      const all = document.querySelectorAll('*')
      const handlers = []
      for (const el of all) {
        for (const attr of el.attributes) {
          if (attr.name.startsWith('on')) {
            handlers.push(`${el.tagName}.${attr.name}`)
          }
        }
      }
      return handlers
    })
    if (inlineHandlers.length > 0) {
      issues.push({ type: 'warn', msg: `Inline event handlers found (XSS vector): ${inlineHandlers.slice(0, 5).join(', ')}` })
    }

  } catch (err) {
    issues.push({ type: 'error', msg: `Security audit error: ${err.message}` })
  }

  await context.close()
  printResults({ path: 'Security Headers', issues })
  return { path: 'Security', issues }
}

async function auditUIUX() {
  console.log('\n=== UI/UX AUDIT ===')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const issues = []

  try {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    // Check focus visibility
    await page.keyboard.press('Tab')
    const focusedEl = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      const cs = getComputedStyle(el)
      return {
        tag: el.tagName,
        outline: cs.outline,
        outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow,
      }
    })
    if (focusedEl) {
      const hasFocus = focusedEl.outline !== 'none' || (focusedEl.boxShadow && focusedEl.boxShadow !== 'none')
      issues.push({ type: focusedEl ? (hasFocus ? 'pass' : 'warn') : 'warn', msg: `Focus style: ${focusedEl ? (hasFocus ? 'visible' : 'missing/outline-none') : 'no focusable element'}` })
    } else {
      issues.push({ type: 'warn', msg: 'No focusable element reached via Tab' })
    }

    // Check color contrast of body text
    const contrastCheck = await page.evaluate(() => {
      const body = document.body
      const cs = getComputedStyle(body)
      return {
        color: cs.color,
        bg: cs.backgroundColor,
      }
    })
    issues.push({ type: 'info', msg: `Body text color: ${contrastCheck.color}, background: ${contrastCheck.bg}` })

    // Check image alt attributes
    const images = await page.$$('img')
    const missingAlt = []
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      if (alt === null) missingAlt.push(await img.getAttribute('src'))
    }
    if (missingAlt.length > 0) {
      issues.push({ type: 'warn', msg: `Images missing alt text: ${missingAlt.length}` })
    }

    // Check for empty links
    const links = await page.$$('a[href]')
    let emptyLinks = 0
    for (const link of links) {
      const text = await link.innerText()
      if (!text.trim()) emptyLinks++
    }
    if (emptyLinks > 0) {
      issues.push({ type: 'warn', msg: `Links with no text: ${emptyLinks}` })
    }

    // Check button accessibility
    const buttons = await page.$$('button')
    let ariaButtons = 0
    for (const btn of buttons) {
      const ariaLabel = await btn.getAttribute('aria-label')
      const text = await btn.innerText()
      if (ariaLabel || text.trim()) ariaButtons++
    }
    if (ariaButtons < buttons.length) {
      issues.push({ type: 'warn', msg: `Buttons without accessible labels: ${buttons.length - ariaButtons}` })
    }

  } catch (err) {
    issues.push({ type: 'error', msg: `UI/UX audit error: ${err.message}` })
  }

  await context.close()
  printResults({ path: 'UI/UX Audit', issues })
  return { path: 'UI/UX', issues }
}

async function audit404Page() {
  console.log('\n=== 404 PAGE AUDIT ===')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const issues = []

  try {
    await page.goto(`${BASE}/nonexistent-page-xyz`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    const content = await page.evaluate(() => document.body.innerText.slice(0, 300))
    issues.push({ type: 'info', msg: `404 content: "${content.slice(0, 100)}..."` })

    // Check if there's a way back
    const homeLink = await page.$('a[href="/"], a:has-text("Home"), a:has-text("Go back")')
    issues.push({ type: homeLink ? 'pass' : 'warn', msg: `Navigation back to home: ${!!homeLink}` })

  } catch (err) {
    issues.push({ type: 'error', msg: `404 audit error: ${err.message}` })
  }

  await context.close()
  printResults({ path: '/nonexistent-page-xyz', issues })
  return { path: '404', issues }
}

function printResults({ path, issues }) {
  console.log(`\n--- ${path} ---`)
  let pass = 0, fail = 0, warn = 0, info = 0, error = 0
  for (const i of issues) {
    const icon = { pass: '✓', fail: '✗', warn: '⚠', info: '·', error: '!' }[i.type] || '?'
    console.log(`  ${icon} [${i.type.toUpperCase()}] ${i.msg}`)
    if (i.type === 'pass') pass++
    else if (i.type === 'fail') fail++
    else if (i.type === 'warn') warn++
    else if (i.type === 'info') info++
    else if (i.type === 'error') error++
  }
  console.log(`  Results: ${pass} passed, ${fail} failed, ${warn} warnings, ${info} info, ${error} errors`)
}

// Run all audits
console.log('========================================')
console.log('  WATCHDOG QA AUDIT')
console.log('========================================')

const results = []

results.push(await auditLandingPage())
results.push(await auditPublicPages())
results.push(await auditDocsPage())
results.push(await auditLoginFlow())
results.push(await auditProtectedRoutes())
results.push(await audit404Page())
results.push(await auditSecurity())
results.push(await auditUIUX())

// Summary
console.log('\n========================================')
console.log('  SUMMARY')
console.log('========================================')
let totalPass = 0, totalFail = 0, totalWarn = 0, totalInfo = 0, totalError = 0
for (const r of results) {
  for (const issue of r.issues) {
    if (issue.type === 'pass') totalPass++
    else if (issue.type === 'fail') totalFail++
    else if (issue.type === 'warn') totalWarn++
    else if (issue.type === 'info') totalInfo++
    else if (issue.type === 'error') totalError++
  }
}
console.log(`Total: ${totalPass} ✓ | ${totalFail} ✗ | ${totalWarn} ⚠ | ${totalInfo} · | ${totalError} !`)

await browser.close()
