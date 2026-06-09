import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Sonar'
const SITE_URL = 'https://sonar.app'
const DEFAULT_DESC = 'Uptime monitoring, error tracing, and incident response for developers.'
const OG_IMAGE = '/og-image.png'

type SEOProps = {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
  type?: 'website' | 'article' | 'product'
  image?: string
}

export function SEO({ title, description, path, noindex, type = 'website', image }: SEOProps) {
  const pageTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — ${DEFAULT_DESC}`
  const desc = description ?? DEFAULT_DESC
  const url = path ? `${SITE_URL}${path}` : SITE_URL
  const ogImage = image ?? OG_IMAGE

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex" />}
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
