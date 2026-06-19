import type { AutoTrackOptions } from './types'

export type AutoTrackerHost = {
  track: (event: string, properties?: Record<string, unknown>) => void
}

const SCROLL_DEPTHS = [25, 50, 75, 100]

export class AutoTracker {
  private host: AutoTrackerHost
  private opts: AutoTrackOptions
  private scrollDepthsReported = new Set<number>()
  private scrollObserver: IntersectionObserver | null = null
  private scrollSentinel: HTMLDivElement | null = null
  private pushStateOriginal: typeof history.pushState | null = null
  private popStateHandler: (() => void) | null = null
  private clickHandler: ((e: MouseEvent) => void) | null = null
  private submitHandler: ((e: SubmitEvent) => void) | null = null
  private originalConsoleError: typeof console.error | null = null
  private originalConsoleWarn: typeof console.warn | null = null
  private active = false

  constructor(host: AutoTrackerHost, opts: AutoTrackOptions) {
    this.host = host
    this.opts = {
      pageViews: opts.pageViews ?? true,
      linkClicks: opts.linkClicks ?? true,
      formSubmissions: opts.formSubmissions ?? true,
      scrollDepth: opts.scrollDepth ?? true,
      consoleErrors: opts.consoleErrors ?? true,
      clickTracking: opts.clickTracking ?? false,
    }
  }

  init() {
    if (this.active) return
    this.active = true

    if (this.opts.pageViews) this.trackPageViews()
    if (this.opts.linkClicks) this.trackLinkClicks()
    if (this.opts.formSubmissions) this.trackFormSubmissions()
    if (this.opts.scrollDepth) this.trackScrollDepth()
    if (this.opts.consoleErrors) this.trackConsoleErrors()
    if (this.opts.clickTracking) this.trackClicks()
  }

  destroy() {
    this.active = false

    if (this.pushStateOriginal && history.pushState !== this.pushStateOriginal) {
      history.pushState = this.pushStateOriginal
    }
    if (this.popStateHandler) {
      window.removeEventListener('popstate', this.popStateHandler)
    }
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler)
    }
    if (this.submitHandler) {
      document.removeEventListener('submit', this.submitHandler)
    }
    if (this.scrollObserver) {
      this.scrollObserver.disconnect()
    }
    if (this.scrollSentinel?.parentNode) {
      this.scrollSentinel.parentNode.removeChild(this.scrollSentinel)
    }
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError
    }
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn
    }
  }

  private trackPageViews() {
    this.popStateHandler = () => {
      this.host.track('page_view', { title: document.title, url: window.location.href })
    }
    window.addEventListener('popstate', this.popStateHandler)

    this.pushStateOriginal = history.pushState.bind(history)
    history.pushState = (...args) => {
      this.pushStateOriginal!.apply(history, args)
      this.host.track('page_view', { title: document.title, url: window.location.href })
    }
  }

  private trackLinkClicks() {
    this.clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const link = target?.closest?.('a')
      if (!link) return
      const href = link.getAttribute('href')
      if (!href) return
      if (!href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#')) return
      if (href.startsWith('#')) return
      if (link.hasAttribute('data-sonar-ignore')) return

      this.host.track('click', {
        category: 'link',
        name: link.textContent?.trim()?.slice(0, 200) || href,
        url: href,
        href,
      })
    }
    document.addEventListener('click', this.clickHandler)
  }

  private trackFormSubmissions() {
    this.submitHandler = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null
      if (!form) return
      if (form.hasAttribute('data-sonar-ignore')) return

      this.host.track('form_submit', {
        category: 'form',
        name: form.getAttribute('name') || form.id || 'unknown',
        url: form.action || window.location.href,
        formId: form.id || undefined,
        formName: form.getAttribute('name') || undefined,
      })
    }
    document.addEventListener('submit', this.submitHandler)
  }

  private trackScrollDepth() {
    this.scrollDepthsReported.clear()

    this.scrollSentinel = document.createElement('div')
    this.scrollSentinel.setAttribute('data-sonar-scroll-sentinel', '')
    this.scrollSentinel.style.position = 'absolute'
    this.scrollSentinel.style.width = '1px'
    this.scrollSentinel.style.height = '1px'
    this.scrollSentinel.style.bottom = '0'
    document.body.appendChild(this.scrollSentinel)

    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.host.track('scroll', {
              category: 'scroll',
              name: '100%',
              depth: 100,
            })
            this.scrollDepthsReported.add(100)
          }
        }
      },
      { threshold: 0 },
    )
    this.scrollObserver.observe(this.scrollSentinel)

    const onScroll = () => {
      const scrollPct = Math.round(
        (window.scrollY + window.innerHeight) / Math.max(document.body.scrollHeight, 1) * 100,
      )
      for (const depth of SCROLL_DEPTHS) {
        if (scrollPct >= depth && !this.scrollDepthsReported.has(depth)) {
          this.scrollDepthsReported.add(depth)
          this.host.track('scroll', {
            category: 'scroll',
            depth,
          })
        }
      }
    }

    let ticking = false
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          onScroll()
          ticking = false
        })
        ticking = true
      }
    })
  }

  private trackConsoleErrors() {
    this.originalConsoleError = console.error
    console.error = (...args: unknown[]) => {
      this.host.track('console_error', {
        category: 'error',
        name: args.map(String).join(' ').slice(0, 500),
      })
      this.originalConsoleError!.apply(console, args)
    }

    this.originalConsoleWarn = console.warn
    console.warn = (...args: unknown[]) => {
      this.host.track('console_error', {
        category: 'warn',
        name: args.map(String).join(' ').slice(0, 500),
      })
      this.originalConsoleWarn!.apply(console, args)
    }
  }

  private trackClicks() {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.hasAttribute('data-sonar-ignore')) return
      if (!target.closest('[data-sonar-track]')) return

      this.host.track('click', {
        category: 'element',
        name: target.textContent?.trim()?.slice(0, 200) || target.tagName.toLowerCase(),
        tagName: target.tagName.toLowerCase(),
        id: target.id || undefined,
        className: target.className?.slice(0, 200) || undefined,
        x: e.clientX,
        y: e.clientY,
      })
    }
    document.addEventListener('click', handler)
  }
}
