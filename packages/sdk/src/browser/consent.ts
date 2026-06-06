import type { ConsentState, ConsentBannerOptions } from './types'

const STORAGE_KEY = 'sonar_consent'

export class ConsentManager {
  private state: ConsentState = 'pending'
  private listeners: Array<(state: ConsentState) => void> = []
  private bannerEl: HTMLElement | null = null
  private bannerOptions: ConsentBannerOptions = {}

  constructor(options?: ConsentBannerOptions) {
    if (options) this.bannerOptions = options
    this.state = this.load()
    if (this.state === 'pending' || this.state === 'denied') {
      this.checkDnt()
    }
  }

  private checkDnt() {
    try {
      const dnt =
        (navigator as Navigator & { doNotTrack?: string }).doNotTrack === '1' ||
        (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
      if (dnt) {
        this.state = 'denied'
        this.save('denied')
      }
    } catch {
      // ignore
    }
  }

  private load(): ConsentState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'granted') return 'granted'
      if (stored === 'denied') return 'denied'
    } catch {
      // localStorage unavailable
    }
    return 'pending'
  }

  private save(state: ConsentState) {
    try {
      localStorage.setItem(STORAGE_KEY, state)
    } catch {
      // ignore
    }
  }

  getConsent(): ConsentState {
    return this.state
  }

  setConsent(state: ConsentState) {
    this.state = state
    this.save(state)
    this.notify()
    this.hideBanner()
  }

  onChange(cb: (state: ConsentState) => void) {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb)
    }
  }

  private notify() {
    for (const cb of this.listeners) {
      try { cb(this.state) } catch { /* noop */ }
    }
  }

  showBanner() {
    if (this.bannerEl || this.state !== 'pending') return
    this.bannerEl = this.renderBanner()
    document.body.appendChild(this.bannerEl)
  }

  hideBanner() {
    if (this.bannerEl) {
      this.bannerEl.remove()
      this.bannerEl = null
    }
  }

  private renderBanner(): HTMLElement {
    const opts = this.bannerOptions
    const position = opts.position ?? 'bottom'
    const text = opts.text ?? 'We use cookies and analytics to understand how our site is used and to improve your experience.'
    const acceptText = opts.acceptText ?? 'Accept All'
    const declineText = opts.declineText ?? 'Reject All'

    const banner = document.createElement('div')
    banner.setAttribute('data-sonar-consent-banner', '')
    const posStyles: Record<string, string> = {
      bottom: 'bottom:0;left:0;right:0',
      'bottom-left': 'bottom:16px;left:16px;max-width:400px',
      'bottom-right': 'bottom:16px;right:16px;max-width:400px',
      top: 'top:0;left:0;right:0',
    }
    banner.setAttribute(
      'style',
      `position:fixed;z-index:2147483647;${posStyles[position] ?? posStyles.bottom};` +
      `padding:16px 24px;background:#1a1a1a;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;` +
      `font-size:14px;line-height:1.5;display:flex;align-items:center;gap:16px;flex-wrap:wrap;` +
      `border-top:1px solid #333;box-shadow:0 -4px 24px rgba(0,0,0,0.4);`,
    )

    const textEl = document.createElement('span')
    textEl.style.flex = '1'
    textEl.style.minWidth = '200px'
    textEl.textContent = text
    banner.appendChild(textEl)

    const actions = document.createElement('div')
    actions.style.display = 'flex'
    actions.style.gap = '8px'

    const declineBtn = document.createElement('button')
    declineBtn.textContent = declineText
    declineBtn.setAttribute(
      'style',
      'padding:8px 16px;border:1px solid #444;background:transparent;color:#aaa;cursor:pointer;font-size:13px;border-radius:4px;',
    )
    declineBtn.onclick = () => this.setConsent('denied')
    actions.appendChild(declineBtn)

    const acceptBtn = document.createElement('button')
    acceptBtn.textContent = acceptText
    acceptBtn.setAttribute(
      'style',
      'padding:8px 16px;border:1px solid #4ade80;background:#4ade80;color:#000;cursor:pointer;font-size:13px;font-weight:600;border-radius:4px;',
    )
    acceptBtn.onclick = () => this.setConsent('granted')
    actions.appendChild(acceptBtn)

    if (opts.privacyPolicyUrl) {
      const link = document.createElement('a')
      link.href = opts.privacyPolicyUrl
      link.target = '_blank'
      link.textContent = 'Privacy Policy'
      link.setAttribute(
        'style',
        'color:#60a5fa;font-size:12px;text-decoration:underline;padding:8px 0;',
      )
      actions.appendChild(link)
    }

    banner.appendChild(actions)
    return banner
  }
}
