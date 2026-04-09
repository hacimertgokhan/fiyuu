/**
 * FiyuuHead - Head/meta tag management per route.
 *
 * @example
 * ```ts
 * FiyuuHead({
 *   title: "My Page - My App",
 *   description: "Page description for SEO",
 *   og: {
 *     title: "My Page",
 *     image: "/images/og.jpg",
 *   },
 * })
 * ```
 */

export interface FiyuuHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
  og?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
  };
  twitter?: {
    card?: "summary" | "summary_large_image" | "app" | "player";
    title?: string;
    description?: string;
    image?: string;
    site?: string;
  };
  /** Additional meta tags */
  meta?: Array<{ name?: string; property?: string; content: string }>;
  /** Link tags (stylesheets, icons, etc.) */
  links?: Array<{ rel: string; href: string; type?: string; sizes?: string }>;
  /** Inline JSON-LD structured data */
  jsonLd?: Record<string, unknown>;
}

/**
 * Generate head meta tags HTML string.
 */
export function FiyuuHead(props: FiyuuHeadProps): string {
  const parts: string[] = [];

  if (props.title) {
    parts.push(`<title>${escapeHtml(props.title)}</title>`);
  }

  if (props.description) {
    parts.push(`<meta name="description" content="${escapeAttr(props.description)}" />`);
  }

  if (props.keywords?.length) {
    parts.push(`<meta name="keywords" content="${escapeAttr(props.keywords.join(", "))}" />`);
  }

  if (props.canonical) {
    parts.push(`<link rel="canonical" href="${escapeAttr(props.canonical)}" />`);
  }

  if (props.robots) {
    parts.push(`<meta name="robots" content="${escapeAttr(props.robots)}" />`);
  }

  // Open Graph
  if (props.og) {
    const og = props.og;
    if (og.title) parts.push(`<meta property="og:title" content="${escapeAttr(og.title)}" />`);
    if (og.description) parts.push(`<meta property="og:description" content="${escapeAttr(og.description)}" />`);
    if (og.image) parts.push(`<meta property="og:image" content="${escapeAttr(og.image)}" />`);
    if (og.url) parts.push(`<meta property="og:url" content="${escapeAttr(og.url)}" />`);
    if (og.type) parts.push(`<meta property="og:type" content="${escapeAttr(og.type)}" />`);
    if (og.siteName) parts.push(`<meta property="og:site_name" content="${escapeAttr(og.siteName)}" />`);
  }

  // Twitter Card
  if (props.twitter) {
    const tw = props.twitter;
    if (tw.card) parts.push(`<meta name="twitter:card" content="${escapeAttr(tw.card)}" />`);
    if (tw.title) parts.push(`<meta name="twitter:title" content="${escapeAttr(tw.title)}" />`);
    if (tw.description) parts.push(`<meta name="twitter:description" content="${escapeAttr(tw.description)}" />`);
    if (tw.image) parts.push(`<meta name="twitter:image" content="${escapeAttr(tw.image)}" />`);
    if (tw.site) parts.push(`<meta name="twitter:site" content="${escapeAttr(tw.site)}" />`);
  }

  // Custom meta tags
  if (props.meta) {
    for (const tag of props.meta) {
      if (tag.name) {
        parts.push(`<meta name="${escapeAttr(tag.name)}" content="${escapeAttr(tag.content)}" />`);
      } else if (tag.property) {
        parts.push(`<meta property="${escapeAttr(tag.property)}" content="${escapeAttr(tag.content)}" />`);
      }
    }
  }

  // Link tags
  if (props.links) {
    for (const link of props.links) {
      const linkAttrs = [`rel="${escapeAttr(link.rel)}"`, `href="${escapeAttr(link.href)}"`];
      if (link.type) linkAttrs.push(`type="${escapeAttr(link.type)}"`);
      if (link.sizes) linkAttrs.push(`sizes="${escapeAttr(link.sizes)}"`);
      parts.push(`<link ${linkAttrs.join(" ")} />`);
    }
  }

  // JSON-LD
  if (props.jsonLd) {
    parts.push(`<script type="application/ld+json">${JSON.stringify(props.jsonLd)}</script>`);
  }

  return parts.join("\n");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
