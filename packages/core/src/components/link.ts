/**
 * FiyuuLink - Optimized link component with prefetching.
 *
 * @example
 * ```ts
 * FiyuuLink({
 *   href: "/about",
 *   children: "About Us",
 *   prefetch: true, // prefetch on hover
 * })
 * ```
 */

export interface FiyuuLinkProps {
  href: string;
  children: string;
  /** Prefetch the page on hover */
  prefetch?: boolean;
  /** CSS class name */
  className?: string;
  /** Open in new tab */
  external?: boolean;
  /** Active class when current route matches */
  activeClass?: string;
  /** Exact match for active state */
  exactActive?: boolean;
  /** Additional attributes */
  attrs?: Record<string, string>;
}

/**
 * Generate an optimized link with optional prefetching.
 */
export function FiyuuLink(props: FiyuuLinkProps): string {
  const {
    href,
    children,
    prefetch = false,
    className = "",
    external = false,
    activeClass = "active",
    exactActive = false,
    attrs = {},
  } = props;

  const isExternal = external || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//");

  const attrParts: string[] = [];
  attrParts.push(`href="${escapeAttr(href)}"`);

  if (className) {
    attrParts.push(`class="${escapeAttr(className)}"`);
  }

  if (isExternal) {
    attrParts.push('target="_blank"');
    attrParts.push('rel="noopener noreferrer"');
  }

  if (prefetch && !isExternal) {
    attrParts.push("data-fiyuu-prefetch");
  }

  if (!isExternal && activeClass) {
    attrParts.push(`data-fiyuu-active-class="${escapeAttr(activeClass)}"`);
    if (exactActive) {
      attrParts.push("data-fiyuu-exact-active");
    }
  }

  // Additional attributes
  for (const [key, value] of Object.entries(attrs)) {
    attrParts.push(`${key}="${escapeAttr(value)}"`);
  }

  return `<a ${attrParts.join(" ")}>${children}</a>`;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
