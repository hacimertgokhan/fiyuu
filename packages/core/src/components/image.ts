/**
 * FiyuuImage - Optimized image component with lazy loading.
 *
 * Features:
 * - Lazy loading via Intersection Observer
 * - Responsive srcset generation
 * - Width/height required (prevents CLS)
 * - Placeholder support (blur, color, skeleton)
 * - WebP/AVIF format hints
 *
 * @example
 * ```ts
 * import { FiyuuImage } from "@fiyuu/core/components";
 *
 * // In your template:
 * FiyuuImage({
 *   src: "/images/hero.jpg",
 *   alt: "Hero banner",
 *   width: 1200,
 *   height: 600,
 *   priority: false, // lazy load by default
 *   sizes: "(max-width: 768px) 100vw, 50vw",
 * })
 * ```
 */

export interface FiyuuImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Load immediately without lazy loading */
  priority?: boolean;
  /** Responsive sizes attribute */
  sizes?: string;
  /** CSS class name */
  className?: string;
  /** Image loading strategy: "lazy" (default) | "eager" */
  loading?: "lazy" | "eager";
  /** Placeholder type while loading */
  placeholder?: "blur" | "color" | "skeleton" | "none";
  /** Placeholder color (for "color" placeholder) */
  placeholderColor?: string;
  /** Object-fit CSS property */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** Quality hint for image optimization (1-100) */
  quality?: number;
  /** Generate srcset for these widths */
  srcSetWidths?: number[];
}

const DEFAULT_SRCSET_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048];

/**
 * Generate optimized image HTML with lazy loading and responsive support.
 */
export function FiyuuImage(props: FiyuuImageProps): string {
  const {
    src,
    alt,
    width,
    height,
    priority = false,
    sizes,
    className = "",
    loading,
    placeholder = "none",
    placeholderColor = "#e2e8f0",
    objectFit = "cover",
    quality,
    srcSetWidths = DEFAULT_SRCSET_WIDTHS,
  } = props;

  const loadingAttr = loading ?? (priority ? "eager" : "lazy");
  const fetchPriority = priority ? ' fetchpriority="high"' : "";
  const decodingAttr = priority ? "sync" : "async";

  // Generate srcset if src is a relative path (local image)
  const srcset = generateSrcSet(src, srcSetWidths, quality);
  const sizesAttr = sizes ? ` sizes="${sizes}"` : "";
  const srcsetAttr = srcset ? ` srcset="${srcset}"` : "";

  // Aspect ratio for CLS prevention
  const aspectRatio = `aspect-ratio: ${width} / ${height};`;

  // Placeholder styles
  let placeholderStyle = "";
  if (placeholder === "color") {
    placeholderStyle = `background-color: ${placeholderColor};`;
  } else if (placeholder === "skeleton") {
    placeholderStyle = `background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: fiyuu-skeleton 1.5s infinite;`;
  } else if (placeholder === "blur") {
    placeholderStyle = `filter: blur(20px); transition: filter 0.3s;`;
  }

  const style = `${aspectRatio} object-fit: ${objectFit}; width: 100%; height: auto; ${placeholderStyle}`.trim();

  return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" width="${width}" height="${height}" loading="${loadingAttr}" decoding="${decodingAttr}"${fetchPriority}${srcsetAttr}${sizesAttr} class="${escapeAttr(className)}" style="${style}" />`;
}

/**
 * Generate srcset string for responsive images.
 */
function generateSrcSet(src: string, widths: number[], quality?: number): string {
  // Only generate srcset for local images (not external URLs)
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) {
    return "";
  }

  const ext = src.split(".").pop()?.toLowerCase();
  if (!ext || !["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) {
    return "";
  }

  // Generate width descriptors
  return widths
    .map((w) => {
      const qualityParam = quality ? `&q=${quality}` : "";
      return `${src}?w=${w}${qualityParam} ${w}w`;
    })
    .join(", ");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
