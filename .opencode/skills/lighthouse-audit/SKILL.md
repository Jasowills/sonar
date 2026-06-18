---
name: lighthouse-audit
description: |
  Run Lighthouse audits on web applications and propose automated fixes.
  Use when the user asks about Lighthouse, performance audits, page speed,
  accessibility audits, SEO audits, best practices, or optimizing their
  web app's scores. Also trigger on keywords: "lighthouse", "audit",
  "performance score", "pagespeed", "web vitals", "core web vitals",
  "FCP", "LCP", "TBT", "CLS", "accessibility audit", "SEO audit".
---

# Lighthouse Audit Skill

Run comprehensive Lighthouse audits on web applications and propose concrete,
implementable fixes. Works with the `scripts/lighthouse-audit.sh` script.

## How to run an audit

```bash
bash scripts/lighthouse-audit.sh <url> [output-path]
```

The URL must be a running application (local dev server, staging, or production).
The script prints the output path to stdout. You can also pass an explicit
output path as the second argument for predictable locations.

**Before running**, ensure the target server is running. For local dev servers,
start it first (e.g., `npm run dev` or `npm run dev:client`).

## Reading the report

The report is Lighthouse's full JSON. Key structure:

```
{
  "categories": {
    "performance":       { "score": 0.0-1.0 },
    "accessibility":     { "score": 0.0-1.0 },
    "best-practices":    { "score": 0.0-1.0 },
    "seo":               { "score": 0.0-1.0 }
  },
  "audits": {
    "<audit-id>": {
      "id": "...",
      "title": "...",
      "description": "...",
      "score": 0.0-1.0 or null,
      "scoreDisplayMode": "numeric|binary|informative|notApplicable|manual|error",
      "numericValue": 123.4,
      "numericUnit": "ms",
      "displayValue": "1.2 s",
      "details": {
        "type": "opportunity|diagnostic|table|filmstrip|...",
        "headings": [...],
        "items": [...]
      }
    }
  }
}
```

- **Score**: `0.0` = fail, `1.0` = perfect. Multiply by 100 for percentage.
- **Category score** = weighted average of audits in that category.
- **Audit `scoreDisplayMode`**: `"notApplicable"` means the audit doesn't apply
  (skip it). `"informative"` has no score. `"error"` means Lighthouse failed
  to run that check.

## Interpretation guidelines

| Score range | Meaning |
|-------------|---------|
| 0.9 – 1.0  | Good (green)  |
| 0.5 – 0.89 | Needs improvement (orange) |
| 0.0 – 0.49 | Poor (red) |

Focus on audits where `score < 0.9` (not just < 0.5). "Opportunity" audits
show estimated savings. "Diagnostic" audits highlight problems to fix.

To find failing audits in a category, iterate `categories[cat].auditRefs`,
look up each `id` in `audits`, and check the score.

## Proposing fixes

For each failing audit, the `description` field explains what's wrong, and
`details.items` often lists specific resources or issues. Use these to:

1. **Identify root causes** — e.g., render-blocking resources, oversized
   images, missing meta tags, low contrast text, missing `alt` attributes.
2. **Pinpoint exact files** — `details.items` often includes URLs, file
   paths, line numbers, or element selectors.
3. **Recommend concrete changes** — e.g., "Add `loading="lazy"` to these 3
   images below the fold", "Inline critical CSS", "Set `font-display: swap`".
4. **Prioritize by impact** — opportunity audits show `numericValue` savings
   (e.g., "Potential savings of 1.2 s"). Fix highest-impact items first.

## Reporting format

Present results like this:

```
## Lighthouse Audit — <url>

### Scores
- **Performance**:      XX/100
- **Accessibility**:    XX/100
- **Best Practices**:   XX/100
- **SEO**:              XX/100

### Key Findings & Fixes

#### Performance
- [audit title] (score X.X)
  What: <one-line summary of the issue>
  Fix: <specific, actionable fix>
  Files affected: <specific files or URLs>

#### Accessibility
...

#### Best Practices
...

#### SEO
...
```

Then implement each fix if the user agrees.
