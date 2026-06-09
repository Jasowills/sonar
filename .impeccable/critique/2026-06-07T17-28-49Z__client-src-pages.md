---
target: Full site audit
total_score: 28
p0_count: 1
p1_count: 2
timestamp: 2026-06-07T17-28-49Z
slug: client-src-pages
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | SSE invalidation works well. No persistent connection status indicator. Loading states present but could show progress. |
| 2 | Match System / Real World | 4/4 | Terminology matches developer mental model (monitors, services, environments). No jargon mismatch. |
| 3 | User Control and Freedom | 2/4 | `window.confirm()` in alerts breaks modal convention. No undo on destructive actions. No cancel on some operations. |
| 4 | Consistency and Standards | 3/4 | Token system consistent across all app pages. Public status page uses hardcoded colors — breaks system. |
| 5 | Error Prevention | 3/4 | Password validation, DELETE confirmation. No password strength meter. |
| 6 | Recognition Rather Than Recall | 3/4 | Sidebar groups are clear. Status dots + labels help. No breadcrumbs for deep pages. |
| 7 | Flexibility and Efficiency | 1/4 | No keyboard shortcuts. No bulk ops. No global search. No customizable dashboard. |
| 8 | Aesthetic and Minimalist Design | 4/4 | Strong hierarchy. Restrained palette. Generous whitespace. No visual noise. |
| 9 | Error Recovery | 3/4 | Error states have retry. Mutation errors inline. Sign-out has confirmation. No auto-retry. |
| 10 | Help and Documentation | 2/4 | /docs exists. No inline tooltips. No contextual help on form fields. No onboarding in empty states. |
| **Total** | | **28/40** | **Good** |

## Anti-Patterns Verdict

**Start here. Does this look AI-generated? No.**

This is deliberate, hand-crafted design. The oklch token system, Geist typeface pairing, restrained palette (zero gradient text, no glassmorphism, no side-stripe borders), and consistent empty-state pattern across every page are specific, opinionated decisions — not generic output.

**Borderline signals caught in review:**
- Numbered feature markers (`01`–`07`) on the landing page — a common AI slop pattern, but rendered in small `font-mono` text so they read as code identifiers rather than decorative numbering.
- Landing page animation stack (GSAP + ScrollTrigger + Lenis + film grain) is elaborate for a "quiet, capable" brand.

**Detector scan (Assessment B):** 1 finding — `border-l-4` on toast-container.tsx:51 that the detector flagged as a side-tab accent border. This is a FALSE POSITIVE: colored left-border on toast notifications is a well-established UI convention for severity coding, not the side-stripe anti-pattern.

**Browser visualization:** Landing page is content-dense (6009px scroll). Login page clean. Status page test route returns "not found" (expected with no matching slug). No horizontal scrolling or broken layouts observed.

## Overall Impression

Sonar has a strong, coherent design foundation — the token system, consistent empty states, and restrained aesthetic are genuinely good. The two biggest opportunities are (1) bringing the public status page into the design system, and (2) adding power-user efficiency features that match the "capable" brand promise. The app feels designed by someone who knows what they're doing; the gaps are in polish and edge cases, not fundamentals.

## What's Working

1. **Design token system** (`client/src/index.css:7-66`) — oklch-based semantic tokens used consistently across every app page. This is the foundation everything else builds on.

2. **Empty state pattern** — Every data page (monitors, errors, analytics, incidents, services, environments, status-pages, deployments, team) uses the same centered icon + heading + body + action pattern. Same spacing, same voice. Examples: `monitors-page.tsx:36-51`, `errors-page.tsx:43-51`.

3. **Status communication** — Status dots with text labels via `monitorStateMeta`, paired with color semantics. The pattern `h-2 w-2 + state.dotClass + state.label` is clean, accessible, and repeatable across pages.

## Priority Issues

### P0 — Public status page ignores design token system
`public-status-page.tsx` uses hardcoded `bg-[#0a0a0a]`, `text-[#ccc]`, `border-[#222]` and hex status colors (`#22c55e`, `#d97706`, `#dc2626`). This breaks theming, WCAG contrast (likely 4.5:1 failure with `#ccc` on `#0a0a0a`), and brand consistency. This is the most visible surface to end users — it should be the most polished, not an outlier.
- **Fix**: Map to the same oklch token system. Use `var(--surface-page)`, `var(--text-main)`, `var(--dot-healthy)`, etc.
- **Suggested command**: `/impeccable polish public-status-page.tsx`

### P1 — Color-only status differentiation (accessibility)
`errors-page.tsx:68-74` uses `bg-[var(--dot-down/healthy/degraded)]` with no accessible text alongside for screen readers. `alerts-page.tsx:222-225` uses color-only dots for channel enabled/disabled. Violates WCAG 2.1 AA 1.4.1 (Use of Color).
- **Fix**: Add text labels, `aria-label`, or `sr-only` text alongside every color indicator.
- **Suggested command**: `/impeccable audit errors-page.tsx`

### P1 — `window.confirm()` in alerts breaks consistency
`alerts-page.tsx:95` uses native `window.confirm()` while every other destructive action uses a custom styled modal. Inconsistent user control.
- **Fix**: Replace with the same confirmation modal pattern used in monitors, services, and environments.
- **Suggested command**: `/impeccable polish alerts-page.tsx`

### P2 — No power-user efficiency features
No keyboard shortcuts, no bulk operations, no global search, no customizable dashboard. 14 nav items with no command palette or jump-to. This directly conflicts with the "capable" brand personality — the tool should feel efficient for regular use.
- **Fix**: Add keyboard shortcuts for common actions, a ⌘K command palette, and bulk select on monitor/incident lists.
- **Suggested command**: `/impeccable harden app-shell.tsx`

### P2 — Landing page animation budget
GSAP + ScrollTrigger + Lenis + film grain overlay is ~25KB+ of animation code for a "quiet" brand. The animations themselves are tasteful but the stack feels misaligned with the brand personality.
- **Fix**: Replace with lightweight IntersectionObserver-based reveals or CSS-only scroll-driven animations.
- **Suggested command**: `/impeccable quieter landing-page.tsx`

### P3 — Settings page flat scroll
`settings-page.tsx` stacks 5 sections (Profile, Workspace, API Keys, Integrations, Danger Zone) vertically with no anchors or scroll-spy. Will become unwieldy as sections grow.
- **Fix**: Add tab navigation or sticky section anchors.
- **Suggested command**: `/impeccable layout settings-page.tsx`

## Persona Red Flags

### Alex (Power User)
- **No keyboard shortcuts or command palette** — every action requires mouse clicks and sidebar navigation. 14 nav items with no jump-to.
- **No bulk operations** on monitors, errors, or incidents. Each item must be managed individually.
- **Dashboard metric cards are fixed** — cannot customize which metrics appear or their arrangement.
- **No global search** — finding a specific monitor or error requires scrolling a list.

### Jordan (First-Timer)
- **Onboarding wizard** exists but can be permanently dismissed — no way to re-trigger.
- **Create flows** use modals with inconsistent form layouts (monitor modal vs inline alerts forms).
- **Edit/delete actions** in monitors-page are icon-only with `title` attributes — first-timers may not discover them.
- **Empty states are helpful**, but no tooltip or inline help explains key concepts like "what's a service vs a monitor."

### Sam (Accessibility)
- **Color-only status dots** on errors page and alerts page — violates WCAG 2.1 AA 1.4.1.
- **Public status page** uses `#ccc` on `#0a0a0a` — likely fails 4.5:1 contrast.
- **Icon-only buttons** (edit, delete) have `title` but no `aria-label`.
- **No visible focus indicators** — relies on browser defaults.

## Minor Observations

- Landing page meta title says "Observability for developers" (after our earlier fix) but hero h1 is "Catch the outage before your users do" — disconnect between SEO snippet and hero message.
- Nav items link to `/app/overview` which redirects to `/app/dashboard` — unnecessary redirect hop.
- Integrations section in settings shows "Coming soon" for all channels — dead end for users who navigated there.
- Deploy correlation is sold as a key landing page differentiator but appears only as a narrow sidebar widget on the dashboard — core value prop is buried in-app.
- The marquee section on landing overflows horizontally at some widths (intentional, but verify at <768px).

## Questions to Consider

1. **Should the public status page share the design token system?** Currently a separate theme with hardcoded values. High-readership surface that should reinforce brand trust.
2. **Can the dashboard surface deploy correlation more prominently?** The landing page sells it as a key differentiator; in-app it's a narrow sidebar widget.
3. **Is GSAP + ScrollTrigger + Lenis the right animation budget for a "quiet" brand?** Consider lighter scroll-triggered reveals.
4. **Would a ⌘K command palette reduce nav friction?** 14 nav items across 4 groups with no search or jump-to.
