/**
 * FiyuuVideo - Optimized video component with lazy loading.
 *
 * @example
 * ```ts
 * FiyuuVideo({
 *   src: "/videos/demo.mp4",
 *   poster: "/images/demo-poster.jpg",
 *   width: 1280,
 *   height: 720,
 * })
 * ```
 */

export interface FiyuuVideoProps {
  src: string;
  width: number;
  height: number;
  /** Poster image URL */
  poster?: string;
  /** Auto-play the video */
  autoplay?: boolean;
  /** Mute the video */
  muted?: boolean;
  /** Loop the video */
  loop?: boolean;
  /** Show controls */
  controls?: boolean;
  /** Lazy load the video */
  lazy?: boolean;
  /** CSS class name */
  className?: string;
  /** Preload strategy */
  preload?: "none" | "metadata" | "auto";
  /** Plays inline on mobile */
  playsInline?: boolean;
}

/**
 * Generate optimized video HTML with lazy loading.
 */
export function FiyuuVideo(props: FiyuuVideoProps): string {
  const {
    src,
    width,
    height,
    poster,
    autoplay = false,
    muted = false,
    loop = false,
    controls = true,
    lazy = true,
    className = "",
    preload = lazy ? "none" : "metadata",
    playsInline = true,
  } = props;

  const attrs: string[] = [];
  attrs.push(`width="${width}"`);
  attrs.push(`height="${height}"`);
  attrs.push(`preload="${preload}"`);

  if (poster) attrs.push(`poster="${escapeAttr(poster)}"`);
  if (autoplay) attrs.push("autoplay");
  if (muted) attrs.push("muted");
  if (loop) attrs.push("loop");
  if (controls) attrs.push("controls");
  if (playsInline) attrs.push("playsinline");
  if (className) attrs.push(`class="${escapeAttr(className)}"`);

  const aspectRatio = `aspect-ratio: ${width} / ${height}; width: 100%; height: auto;`;
  attrs.push(`style="${aspectRatio}"`);

  // Determine source type
  const ext = src.split(".").pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    mov: "video/quicktime",
  };
  const mimeType = ext ? typeMap[ext] ?? "video/mp4" : "video/mp4";

  if (lazy) {
    // Lazy-loaded video: uses data-src, loaded by client runtime
    return `<video ${attrs.join(" ")} data-fiyuu-lazy-video data-src="${escapeAttr(src)}">
  <source data-src="${escapeAttr(src)}" type="${mimeType}" />
  Your browser does not support the video tag.
</video>`;
  }

  return `<video ${attrs.join(" ")}>
  <source src="${escapeAttr(src)}" type="${mimeType}" />
  Your browser does not support the video tag.
</video>`;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
