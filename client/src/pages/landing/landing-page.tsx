import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  Activity,
  ArrowRight,
  BellRing,
  Check,
  LifeBuoy,
  Package,
  Radar,
  Siren,
} from 'lucide-react'

import { HeroMockup } from './hero-mockup'
import { LogoMark } from '@/components/logo'

const primaryCta =
  'group inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-6 py-3.5 text-sm font-semibold text-[var(--text-main)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]'

const ghostCta =
  'inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] px-6 py-3.5 text-sm font-semibold text-[var(--text-main)] transition-colors duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]'

const sectionEyebrow =
  'font-[var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]'

const marqueeItems = [
  'Uptime monitoring',
  'Error tracing',
  'Alert routing',
  'Incident timelines',
  'Status pages',
  'Deploy correlation',
]

const stats = [
  { to: '5', decimals: 0, suffix: '', label: 'signals unified on one surface' },
  { to: '30', decimals: 0, suffix: 's', label: 'default check cadence, tunable per monitor' },
  { to: '3', decimals: 0, suffix: '', label: 'environments modelled from the first build' },
]

const features = [
  {
    icon: Radar,
    num: '01',
    title: 'Uptime monitoring',
    desc: 'HTTP checks with status-code and keyword assertions, on the cadence you set — scoped per service and per environment.',
    span: 'lg:col-span-4',
  },
  {
    icon: Activity,
    num: '02',
    title: 'Error tracing',
    desc: 'A first-party SDK groups exceptions into stable fingerprints, tagged by release.',
    span: 'lg:col-span-2',
  },
  {
    icon: BellRing,
    num: '03',
    title: 'Alert routing',
    desc: 'Email, Slack, and webhook channels with rules calm enough to actually keep on.',
    span: 'lg:col-span-2',
  },
  {
    icon: Siren,
    num: '04',
    title: 'Incident timelines',
    desc: 'Detected to resolved — every update in one legible thread the whole team reads.',
    span: 'lg:col-span-2',
  },
  {
    icon: LifeBuoy,
    num: '05',
    title: 'Status pages',
    desc: 'Branded public pages that inherit the same quiet language as the product.',
    span: 'lg:col-span-2',
  },
  {
    icon: Package,
    num: '06',
    title: 'Deploy correlation',
    desc: 'Every release lands on the same timeline as your incidents and latency — so root-cause starts with a fact, not a guess.',
    span: 'lg:col-span-6',
  },
]

const steps = [
  {
    n: '01',
    title: 'Connect',
    body: 'Point a monitor at any endpoint, or drop the first-party SDK into your application.',
  },
  {
    n: '02',
    title: 'Watch',
    body: 'Sonar checks, traces, and correlates around the clock — quietly, without noise.',
  },
  {
    n: '03',
    title: 'Respond',
    body: 'When something drifts, the right people get one clear, routed signal — not forty.',
  },
]

function Nav({ onNavigate }: { onNavigate: (target: string) => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border-soft)] bg-[color-mix(in_oklch,var(--surface-page)_80%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-main)]">
            Sonar
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-[var(--text-muted)] md:flex">
          <button
            type="button"
            onClick={() => onNavigate('#features')}
            className="transition-colors hover:text-[var(--text-main)]"
          >
            Product
          </button>
          <button
            type="button"
            onClick={() => onNavigate('#how')}
            className="transition-colors hover:text-[var(--text-main)]"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => onNavigate('#deploys')}
            className="transition-colors hover:text-[var(--text-main)]"
          >
            Deploy correlation
          </button>
          <Link
            to="/docs"
            className="transition-colors hover:text-[var(--text-main)]"
          >
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero({ onNavigate }: { onNavigate: (target: string) => void }) {
  return (
    <section className="relative px-5 pb-20 pt-36 lg:px-8 lg:pt-44">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(58%_60%_at_50%_0%,color-mix(in_oklch,white_10%,transparent),transparent_72%)]"
      />

      <div className="mx-auto max-w-5xl text-center">
        <span
          data-hero-item
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-muted)]"
        >
          <span className="signal-pulse h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.17_152)]" />
          Observability for small SaaS teams
        </span>

        <h1
          data-hero-item
          className="mt-7 text-[clamp(2.6rem,7vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--text-main)]"
        >
          Catch the outage
          <br />
          <span className="text-[var(--text-muted)]">before your users do.</span>
        </h1>

        <p
          data-hero-item
          className="mx-auto mt-6 max-w-xl text-base leading-7 text-[var(--text-muted)] lg:text-lg"
        >
          Sonar unifies uptime checks, error tracing, alerting, and incident
          response on one quiet operational surface — so a three-person team can
          run like a platform org.
        </p>

        <div
          data-hero-item
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/app/overview" className={primaryCta}>
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => onNavigate('#how')}
            className={ghostCta}
          >
            See how it works
          </button>
        </div>
      </div>

      <div data-hero-mockup className="mx-auto mt-16 max-w-3xl lg:mt-20">
        <HeroMockup />
      </div>
    </section>
  )
}

function Marquee() {
  const doubled = [...marqueeItems, ...marqueeItems]

  return (
    <section className="overflow-hidden border-y border-[var(--border-soft)] py-5">
      <div className="landing-marquee flex w-max items-center gap-8">
        {doubled.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-8">
            <span className="font-[var(--font-mono)] text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {item}
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--border-strong)]" />
          </span>
        ))}
      </div>
    </section>
  )
}

function StatBand() {
  return (
    <section className="px-5 py-24 lg:px-8 lg:py-32">
      <div
        data-reveal-group
        className="mx-auto grid max-w-5xl gap-px overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--border-soft)] sm:grid-cols-3"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[var(--surface-page)] p-8 lg:p-10">
            <p className="font-[var(--font-mono)] text-5xl font-semibold tracking-[-0.04em] text-[var(--text-main)]">
              <span
                data-counter
                data-to={stat.to}
                data-decimals={stat.decimals}
              >
                {stat.to}
              </span>
              {stat.suffix}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="px-5 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <div data-reveal className="max-w-2xl">
          <p className={sectionEyebrow}>Product</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-main)]">
            Five signals teams usually buy separately. One surface.
          </h2>
        </div>

        <div
          data-reveal-group
          className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className={`group flex flex-col rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-7 transition-colors duration-200 hover:border-[var(--border-strong)] ${feature.span}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-page)] text-[var(--text-main)] transition-colors group-hover:border-[var(--border-strong)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-[var(--font-mono)] text-xs text-[var(--text-muted)]">
                    {feature.num}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-[var(--text-main)]">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
                  {feature.desc}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Steps() {
  return (
    <section
      id="how"
      className="border-t border-[var(--border-soft)] px-5 py-24 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div data-reveal>
          <p className={sectionEyebrow}>How it works</p>
          <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-main)]">
            From signal to ownership in three moves.
          </h2>
        </div>

        <div
          data-reveal-group
          className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8"
        >
          {steps.map((step) => (
            <div key={step.n}>
              <p className="font-[var(--font-mono)] text-sm text-[var(--text-muted)]">
                {step.n}
              </p>
              <div className="mt-4 h-px w-full bg-[var(--border-soft)]" />
              <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-[var(--text-main)]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DeploySpotlight() {
  const points = [
    'Record deploys from CI with a single POST request',
    'See every release beside the incident that followed it',
    'Roll-backs and failed deploys flagged inline on the timeline',
  ]

  return (
    <section id="deploys" className="px-5 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-reveal>
          <p className={sectionEyebrow}>Deploy correlation</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[var(--text-main)]">
            “Did the deploy do it?”
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-[var(--text-muted)]">
            Every release lands on the same timeline as your incidents and
            latency. The first question of every outage stops being a guess.
          </p>
          <ul className="mt-8 space-y-3.5">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-sm leading-6 text-[var(--text-muted)]"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-main)]" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div
          data-reveal
          className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-7 lg:p-8"
        >
          <p className="font-[var(--font-mono)] text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Production · last 60 minutes
          </p>

          <div className="mt-7">
            <div className="flex gap-4">
              <div className="flex flex-col items-center pt-1">
                <span className="h-3 w-3 shrink-0 rounded-full bg-[oklch(0.78_0.16_75)]" />
                <span
                  data-deploy-track
                  className="mt-1 w-px flex-1 bg-[var(--border-strong)]"
                />
              </div>
              <div className="pb-9">
                <p className="font-[var(--font-mono)] text-sm text-[var(--text-main)]">
                  checkout-web@2026.5.14
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Deploy · rolled back · 09:14 UTC
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="pt-1">
                <span className="block h-3 w-3 rounded-full bg-[oklch(0.62_0.22_22)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  Checkout latency spike
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Incident · Sev 2 · opened 09:14 — minutes after the deploy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-5 py-28 lg:px-8 lg:py-40">
      <div
        data-reveal
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[1.8rem] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-6 py-20 text-center lg:py-24"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(52%_64%_at_50%_0%,color-mix(in_oklch,white_9%,transparent),transparent_72%)]"
        />
        <h2 className="relative text-[clamp(2.2rem,4.5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--text-main)]">
          Run production like you
          <br />
          have a platform team.
        </h2>
        <p className="relative mx-auto mt-5 max-w-md text-base text-[var(--text-muted)]">
          One surface for uptime, errors, alerts, incidents, and status. Open it
          and see.
        </p>
        <div className="relative mt-9 flex justify-center">
          <Link to="/app/overview" className={primaryCta}>
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer({ onNavigate }: { onNavigate: (target: string) => void }) {
  return (
    <footer className="border-t border-[var(--border-soft)] px-5 py-16 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
              <LogoMark className="h-7 w-7" />
            <span className="text-sm font-semibold text-[var(--text-main)]">
              Sonar
            </span>
          </div>
          <p className="max-w-xs text-xs leading-6 text-[var(--text-muted)]">
            Observability for small SaaS teams. Uptime checks, error tracing,
            alert routing, incident timelines, and status pages — on one quiet
            operational surface.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Product
          </p>
          <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
            <button
              type="button"
              onClick={() => onNavigate('#features')}
              className="text-left transition-colors hover:text-[var(--text-main)]"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => onNavigate('#how')}
              className="text-left transition-colors hover:text-[var(--text-main)]"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => onNavigate('#deploys')}
              className="text-left transition-colors hover:text-[var(--text-main)]"
            >
              Deploy correlation
            </button>
            <Link
              to="/docs"
              className="transition-colors hover:text-[var(--text-main)]"
            >
              Docs
            </Link>
            <Link
              to="/app/overview"
              className="transition-colors hover:text-[var(--text-main)]"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Company
          </p>
          <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
            <Link
              to="/privacy"
              className="transition-colors hover:text-[var(--text-main)]"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="transition-colors hover:text-[var(--text-main)]"
            >
              Terms &amp; Conditions
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Get started
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="group inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-[var(--border-soft)] pt-8 text-center text-xs text-[var(--text-muted)]">
        &copy; {new Date().getFullYear()} Sonar. All rights reserved.
      </div>
    </footer>
  )
}

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    gsap.registerPlugin(ScrollTrigger)

    let lenis: Lenis | null = null
    const ticker = (time: number) => {
      lenis?.raf(time * 1000)
    }

    if (!reduceMotion) {
      lenis = new Lenis({ duration: 1.15 })
      lenisRef.current = lenis
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(ticker)
      gsap.ticker.lagSmoothing(0)
    }

    const ctx = gsap.context(() => {
      if (reduceMotion) return

      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      timeline
        .from(root.querySelectorAll('[data-hero-item]'), {
          y: 34,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.09,
        })
        .from(
          root.querySelectorAll('[data-hero-mockup]'),
          { y: 72, autoAlpha: 0, scale: 0.97, duration: 1.15 },
          '-=0.55',
        )

      root.querySelectorAll('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 46,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 86%' },
        })
      })

      root.querySelectorAll('[data-reveal-group]').forEach((group) => {
        gsap.from(group.children, {
          y: 40,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: group, start: 'top 82%' },
        })
      })

      root.querySelectorAll('[data-counter]').forEach((node) => {
        const element = node as HTMLElement
        const target = parseFloat(element.dataset.to ?? '0')
        const decimals = parseInt(element.dataset.decimals ?? '0', 10)
        const proxy = { value: 0 }
        gsap.to(proxy, {
          value: target,
          duration: 1.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 90%' },
          onUpdate: () => {
            element.textContent = proxy.value.toFixed(decimals)
          },
        })
      })

      root.querySelectorAll('[data-deploy-track]').forEach((element) => {
        gsap.from(element, {
          scaleY: 0,
          transformOrigin: 'top center',
          duration: 1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: element, start: 'top 90%' },
        })
      })
    })

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
    }

    return () => {
      ctx.revert()
      if (lenis) {
        gsap.ticker.remove(ticker)
        lenis.destroy()
        lenisRef.current = null
      }
    }
  }, [])

  const navigateTo = (target: string) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: -72 })
    } else {
      document
        .querySelector(target)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div
      ref={rootRef}
      className="dark relative min-h-dvh overflow-clip bg-[var(--surface-page)] font-[var(--font-sans)] text-[var(--text-main)] antialiased"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Sonar",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            description:
              "Uptime monitoring, error tracing, alert routing, incident response, and status pages for SaaS teams.",
            url: "https://sonar.app",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
      {createPortal(
        <div className="landing-grain" aria-hidden />,
        document.body,
      )}
      <Nav onNavigate={navigateTo} />
      <main>
        <Hero onNavigate={navigateTo} />
        <Marquee />
        <StatBand />
        <Features />
        <Steps />
        <DeploySpotlight />
        <FinalCta />
      </main>
      <Footer onNavigate={navigateTo} />
    </div>
  )
}
