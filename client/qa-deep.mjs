import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'
const API = 'http://localhost:8080'

const browser = await chromium.launch({ headless: true })

async function deepAuditLoginRegister() {
  console.log('\n=== DEEP: AUTH FLOW ===')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  // Track requests
  const requests = []
  page.on('request', req => {
    if (req.url().includes('/auth/') || req.url().includes('/graphql')) {
      requests.push({ url: req.url().split('?')[0], method: req.method(), body: req.postData()?.slice(0, 200) })
    }
  })

  const issues = []

  // 1. Check login page for register link
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  
  const bodyText = await page.evaluate(() => document.body.innerText)
  issues.push({ type: 'info', msg: `Page headings: ${bodyText.slice(0, 300).replace(/\n/g, ' | ')}` })

  // Check for register/signup link
  const registerLinks = await page.$$('a[href*="register"], a[href*="signup"], a:has-text("Create"), a:has-text("Sign up")')
  issues.push({ type: registerLinks.length > 0 ? 'pass' : 'fail', msg: `Register/Signup link: ${registerLinks.length > 0 ? 'found' : 'NOT FOUND — users cannot register!'}` })

  // Check for toggle between login/register
  const allLinks = await page.$$('a')
  let hasAccountQuestion = false
  for (const link of allLinks) {
    const text = await link.innerText()
    if (/register|sign.?up|create account|no account/i.test(text)) {
      hasAccountQuestion = true
      issues.push({ type: 'pass', msg: `Found account creation link: "${text}"` })
    }
  }
  if (!hasAccountQuestion) {
    issues.push({ type: 'warn', msg: 'No "register" or "create account" option anywhere on login page' })
  }

  // 2. Try submitting register form via API directly
  console.log('  Trying registration via API...')
  try {
    const registerRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'qa-test-' + Date.now() + '@test.com', password: 'TestPass123!', name: 'QA Tester' })
    })
    const registerData = await registerRes.json()
    issues.push({ type: 'info', msg: `Register API: ${registerRes.status} — ${JSON.stringify(registerData).slice(0, 200)}` })
    
    if (registerRes.ok && registerData.token) {
      issues.push({ type: 'pass', msg: 'Registration successful, token received' })
      
      // Try logging in with same credentials
      const loginRes = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerData.email || ('qa-test-' + Date.now() + '@test.com'), password: 'TestPass123!' })
      })
      const loginData = await loginRes.json()
      issues.push({ type: 'info', msg: `Login API: ${loginRes.status} — ${JSON.stringify(loginData).slice(0, 200)}` })

      if (loginRes.ok && loginData.token) {
        issues.push({ type: 'pass', msg: 'Login successful after registration' })
        
        // Use token to access GraphQL
        const gqlRes = await fetch(`${API}/graphql`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`
          },
          body: JSON.stringify({ query: '{ me { id email fullName } }' })
        })
        const gqlData = await gqlRes.json()
        issues.push({ type: 'info', msg: `GraphQL /me: ${JSON.stringify(gqlData).slice(0, 200)}` })
        
        // Check if membership + workspace were created
        const wsRes = await fetch(`${API}/graphql`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`
          },
          body: JSON.stringify({ query: '{ workspaces { id name projects { id name environments { id name } } } }' })
        })
        const wsData = await wsRes.json()
        issues.push({ type: 'info', msg: `GraphQL workspaces: ${JSON.stringify(wsData).slice(0, 300)}` })
      }
    } else {
      // Check MongoDB error
      if (registerData.message && registerData.message.includes('database') || registerData.message?.includes('connect') || registerData.message?.includes('Mongo')) {
        issues.push({ type: 'warn', msg: `MongoDB not connected — register returned ${registerRes.status}: ${registerData.message?.slice(0, 100)}` })
      }
    }
  } catch (err) {
    issues.push({ type: 'error', msg: `API call failed: ${err.message}` })
  }

  // 3. Check password validation on server
  try {
    const weakPassRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'weak@test.com', password: '123' })
    })
    const weakPassData = await weakPassRes.json()
    issues.push({ type: 'info', msg: `Weak password (3 chars): ${weakPassRes.status} — ${weakPassData.message?.slice(0, 100)}` })
  } catch (err) {}

  // 4. Check for email enumeration (different error for existing vs non-existing email)
  try {
    const notExistRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'definitely-not-exists-' + Date.now() + '@test.com', password: 'TestPass123!' })
    })
    const notExistData = await notExistRes.json()
    issues.push({ type: 'info', msg: `Login non-existent user: ${notExistRes.status} — ${notExistData.message?.slice(0, 100)}` })
  } catch (err) {}

  // 5. Check for rate limiting headers
  issues.push({ type: 'warn', msg: 'Rate limiting: not checked (requires 429 response test)' })

  printResults({ path: 'Auth Flow', issues })
  await context.close()
}

async function checkRegistrationOnClient() {
  console.log('\n=== DEEP: CLIENT REGISTRATION UI ===')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const issues = []

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // The login page might have a hidden register form or toggle
  const html = await page.evaluate(() => document.querySelector('#root')?.innerHTML || '')
  const hasRegisterForm = /register|sign.?up|create/i.test(html)
  issues.push({ type: hasRegisterForm ? 'pass' : 'fail', msg: `Register form in DOM: ${hasRegisterForm}` })

  // Check if there's a visual toggle between login and register
  const tabs = await page.$$('[role="tab"], [class*="tab"], button:has-text("Login"), button:has-text("Register")')
  issues.push({ type: 'info', msg: `Auth mode tabs/buttons: ${tabs.length}` })
  for (const tab of tabs) {
    issues.push({ type: 'info', msg: `Auth tab: "${await tab.innerText()}"` })
  }

  // Check the page title
  const title = await page.title()
  issues.push({ type: 'info', msg: `Page title: "${title}"` })

  // Check if all public pages share the same title
  const pages = ['/', '/docs', '/privacy', '/terms']
  const titles = {}
  for (const p of pages) {
    const pPage = await (await browser.newContext()).newPage()
    await pPage.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 10000 })
    const t = await pPage.title()
    titles[p] = t
    await pPage.context().close()
  }
  const uniqueTitles = [...new Set(Object.values(titles))]
  if (uniqueTitles.length === 1) {
    issues.push({ type: 'fail', msg: `All public pages share the same title "${uniqueTitles[0]}" — bad for SEO/tabs` })
  } else {
    issues.push({ type: 'pass', msg: `Page titles vary: ${JSON.stringify(titles)}` })
  }

  // Check if OAuth callback page exists and is functional
  const callbackPage = await (await browser.newContext()).newPage()
  await callbackPage.goto(`${BASE}/auth/callback`, { waitUntil: 'networkidle' })
  await callbackPage.waitForTimeout(500)
  const callbackText = await callbackPage.evaluate(() => document.body.innerText.slice(0, 200))
  issues.push({ type: 'info', msg: `Auth callback page content: "${callbackText.replace(/\n/g, ' | ')}"` })
  
  // Check if callback has a loading spinner or error handling
  const callbackSpinner = await callbackPage.$('[class*="spinner"], [class*="loading"], svg[class*="animate"]')
  issues.push({ type: callbackSpinner ? 'pass' : 'warn', msg: `Callback page loading indicator: ${!!callbackSpinner}` })
  await callbackPage.context().close()

  printResults({ path: 'Client Registration', issues })
  await context.close()
}

async function checkPrivacyTermsDocs() {
  console.log('\n=== DEEP: LEGAL & DOCS PAGES ===')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const issues = []

  // Check privacy page
  const pPage = await context.newPage()
  await pPage.goto(`${BASE}/privacy`, { waitUntil: 'networkidle' })
  await pPage.waitForTimeout(500)
  const privacyText = await pPage.evaluate(() => document.body.innerText)
  const privacyWordCount = privacyText.split(/\s+/).length
  issues.push({ type: 'info', msg: `Privacy page: ${privacyWordCount} words` })
  if (privacyWordCount < 50) issues.push({ type: 'fail', msg: 'Privacy page has very little content' })
  
  // Check for placeholder/boilerplate
  if (/lorem ipsum|coming soon|placeholder/i.test(privacyText)) {
    issues.push({ type: 'fail', msg: 'Privacy page uses placeholder/boilerplate text' })
  }
  
  // Check terms page
  const tPage = await context.newPage()
  await tPage.goto(`${BASE}/terms`, { waitUntil: 'networkidle' })
  await tPage.waitForTimeout(500)
  const termsText = await tPage.evaluate(() => document.body.innerText)
  const termsWordCount = termsText.split(/\s+/).length
  issues.push({ type: 'info', msg: `Terms page: ${termsWordCount} words` })
  if (termsWordCount < 50) issues.push({ type: 'fail', msg: 'Terms page has very little content' })
  if (/lorem ipsum|coming soon|placeholder/i.test(termsText)) {
    issues.push({ type: 'fail', msg: 'Terms page uses placeholder/boilerplate text' })
  }

  // Check docs page content quality
  const dPage = await context.newPage()
  await dPage.goto(`${BASE}/docs`, { waitUntil: 'networkidle' })
  await dPage.waitForTimeout(500)
  const docsText = await dPage.evaluate(() => document.body.innerText)
  const docsWordCount = docsText.split(/\s+/).length
  issues.push({ type: 'info', msg: `Docs page: ${docsWordCount} words` })
  
  // Check for broken nav links on docs
  const docLinks = await dPage.$$('nav a[href], aside a[href]')
  issues.push({ type: 'info', msg: `Doc nav links: ${docLinks.length}` })
  
  // Verify each sidebar link navigates correctly
  let brokenLinks = 0
  for (const link of docLinks) {
    const href = await link.getAttribute('href')
    if (href && href.startsWith('/')) {
      // Quick check: does the target section exist on the page?
      if (href.startsWith('/docs#')) {
        const id = href.replace('/docs#', '')
        const target = await dPage.$(`#${id}, [name="${id}"]`)
        if (!target) brokenLinks++
      }
    }
  }
  if (brokenLinks > 0) {
    issues.push({ type: 'warn', msg: `Broken docs anchor links: ${brokenLinks}` })
  }

  // Check code examples are present
  const codeBlocks = await dPage.$$('pre, code')
  issues.push({ type: 'info', msg: `Docs code blocks: ${codeBlocks.length}` })
  if (codeBlocks.length === 0) issues.push({ type: 'warn', msg: 'No code examples on docs page' })

  await context.close()
  printResults({ path: 'Legal & Docs', issues })
}

async function checkServerSecurity() {
  console.log('\n=== DEEP: SERVER SECURITY ===')
  const issues = []

  // Check error message leakage
  try {
    const badGql = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __schema { types { name } } }' })
    })
    const badGqlData = await badGql.json()
    // Introspection might be enabled
    if (badGqlData.data?.__schema) {
      issues.push({ type: 'warn', msg: 'GraphQL introspection is enabled (exposes full schema)' })
    } else {
      issues.push({ type: 'pass', msg: 'GraphQL introspection appears disabled' })
    }
  } catch (err) {}

  // Check if playground/graphiql is enabled
  try {
    const playgroundRes = await fetch(`${API}/graphql`, {
      method: 'GET',
      headers: { 'Accept': 'text/html' }
    })
    const text = await playgroundRes.text()
    if (text.includes('graphiql') || text.includes('playground') || text.includes('Apollo')) {
      issues.push({ type: 'warn', msg: 'GraphQL playground/GraphiQL is enabled in production' })
    } else {
      issues.push({ type: 'pass', msg: 'GraphQL playground disabled or not detected' })
    }
  } catch (err) {}

  // Check for CORS misconfiguration
  try {
    const corsRes = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'https://evil-site.com'
      },
      body: JSON.stringify({ query: '{ __typename }' })
    })
    const allowOrigin = corsRes.headers.get('access-control-allow-origin')
    if (allowOrigin === '*') {
      issues.push({ type: 'fail', msg: 'CORS allows all origins (*)' })
    } else if (allowOrigin) {
      issues.push({ type: 'info', msg: `CORS origin: ${allowOrigin}` })
    }
  } catch (err) {}

  // Check for stack traces in error responses
  try {
    const errRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: null, password: null })
    })
    const errData = await errRes.json()
    const errString = JSON.stringify(errData)
    if (errString.includes('Error:') || errString.includes('at ') || errString.includes('stack')) {
      issues.push({ type: 'fail', msg: 'Stack traces leaked in error responses' })
    } else {
      issues.push({ type: 'pass', msg: 'Error responses sanitized' })
    }
  } catch (err) {}

  // Check JWT secret strength through timing
  // This is hard to test programmatically — note it
  issues.push({ type: 'info', msg: 'JWT algorithm: HS256 (symmetric). If JWT_SECRET is weak, tokens can be forged' })

  printResults({ path: 'Server Security', issues })
}

async function checkResponsiveAndConsole() {
  console.log('\n=== DEEP: RESPONSIVE & CONSOLE ===')
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } }) // iPhone X
  const page = await context.newPage()
  const issues = []
  const consoleErrors = []
  const consoleWarnings = []
  
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
    if (msg.type() === 'warning') consoleWarnings.push(msg.text())
  })

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  issues.push({ type: 'info', msg: `Console errors on landing: ${consoleErrors.length}` })
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => issues.push({ type: 'error', msg: `Console error: ${e.slice(0, 200)}` }))
  }
  issues.push({ type: 'info', msg: `Console warnings: ${consoleWarnings.length}` })
  if (consoleWarnings.length > 0) {
    consoleWarnings.slice(0, 3).forEach(w => issues.push({ type: 'warn', msg: `Console warning: ${w.slice(0, 200)}` }))
  }

  // Check if nav is visible on mobile
  const navVisible = await page.evaluate(() => {
    const nav = document.querySelector('nav, header')
    if (!nav) return false
    const cs = getComputedStyle(nav)
    return cs.display !== 'none' && cs.visibility !== 'hidden'
  })
  issues.push({ type: navVisible ? 'pass' : 'fail', msg: `Navigation visible on mobile: ${navVisible}` })

  // Check for mobile menu button
  const menuBtn = await page.$('button[class*="menu"], button[class*="hamburger"], button[aria-label*="menu" i], button[aria-label*="nav" i]')
  issues.push({ type: menuBtn ? 'pass' : 'warn', msg: `Mobile hamburger menu: ${!!menuBtn}` })

  // Check content is not cut off
  const viewportOverflow = await page.evaluate(() => {
    const body = document.body
    return body.scrollWidth > body.clientWidth || body.scrollHeight > body.clientHeight
  })
  issues.push({ type: 'info', msg: `Page scrolls (content not clipped): ${viewportOverflow}` })

  await context.close()
  printResults({ path: 'Responsive & Console', issues })
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

// Run deep audits
console.log('========================================')
console.log('  DEEP QA AUDIT')
console.log('========================================')

await deepAuditLoginRegister()
await checkRegistrationOnClient()
await checkPrivacyTermsDocs()
await checkServerSecurity()
await checkResponsiveAndConsole()

await browser.close()
