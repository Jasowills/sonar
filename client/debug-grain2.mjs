import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// The grain element at opacity 0.15 should be visible enough
// Let's take a screenshot and also check if we can see it in a different way

// Remove the grain and take screenshot
const noGrainBuf = await page.evaluate(async () => {
  const el = document.querySelector('.landing-grain')
  if (el) el.style.display = 'none'
  return 'hidden'
})
await page.waitForTimeout(300)

// Screenshot without grain
await page.screenshot({ path: '/tmp/without-grain.png', fullPage: false })

// Show grain again
await page.evaluate(() => {
  const el = document.querySelector('.landing-grain')
  if (el) {
    el.style.display = 'block'
    el.style.opacity = '0.5'  // Use high opacity for this test
  }
})
await page.waitForTimeout(300)

// Screenshot with grain at 0.5
await page.screenshot({ path: '/tmp/with-grain-050.png', fullPage: false })

// Restore to CSS value
await page.evaluate(() => {
  const el = document.querySelector('.landing-grain')
  if (el) {
    el.style.opacity = ''  // Reset to CSS
  }
})
await page.waitForTimeout(300)

// Screenshot with CSS opacity
await page.screenshot({ path: '/tmp/with-grain-css.png', fullPage: false })

// Read file sizes
import { readFileSync } from 'fs'
const sizes = {
  without: readFileSync('/tmp/without-grain.png').length,
  with050: readFileSync('/tmp/with-grain-050.png').length,
  withCSS: readFileSync('/tmp/with-grain-css.png').length,
}
console.log('File sizes:', JSON.stringify(sizes, null, 2))

// Now let's check if the SVG noise is actually rendering by creating a visual test
const svgRenders = await page.evaluate(() => {
  // Create a div with the same SVG background but at full opacity to verify it renders
  const test = document.createElement('div')
  test.style.cssText = 'position:fixed;top:100px;left:100px;width:220px;height:220px;z-index:99999;opacity:1;background-repeat:repeat;background-size:220px 220px;'
  
  // Test with the actual CSS background image value
  const grain = document.querySelector('.landing-grain')
  if (!grain) return { error: 'no grain element' }
  const cs = getComputedStyle(grain)
  test.style.backgroundImage = cs.backgroundImage
  document.body.appendChild(test)
  
  // Check if the test element has a visible background
  const testCs = getComputedStyle(test)
  const bgImage = testCs.backgroundImage
  const hasBg = bgImage !== 'none'
  
  // Also create a pure SVG inline element to compare
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svgEl.setAttribute('width', '220')
  svgEl.setAttribute('height', '220')
  svgEl.style.position = 'fixed'
  svgEl.style.top = '350px'
  svgEl.style.left = '100px'
  svgEl.style.zIndex = '99999'
  
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
  filter.setAttribute('id', 'noiseTest')
  const turb = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence')
  turb.setAttribute('type', 'fractalNoise')
  turb.setAttribute('baseFrequency', '0.86')
  turb.setAttribute('numOctaves', '3')
  turb.setAttribute('stitchTiles', 'stitch')
  filter.appendChild(turb)
  defs.appendChild(filter)
  svgEl.appendChild(defs)
  
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('width', '100%')
  rect.setAttribute('height', '100%')
  rect.setAttribute('filter', 'url(#noiseTest)')
  svgEl.appendChild(rect)
  
  document.body.appendChild(svgEl)
  
  return {
    cssBgImage: bgImage.slice(0, 80),
    cssBgHasValue: hasBg,
    svgElementAdded: true,
  }
})

console.log('SVG render test:', JSON.stringify(svgRenders, null, 2))

await page.screenshot({ path: '/tmp/noise-test.png', fullPage: false })
console.log('Test screenshot at /tmp/noise-test.png')

await browser.close()
