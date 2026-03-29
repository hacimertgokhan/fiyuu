export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

export function mediaUp(name: BreakpointName, css: string): string {
  return `@media (min-width:${BREAKPOINTS[name]}px){${css}}`;
}

export function mediaDown(name: BreakpointName, css: string): string {
  return `@media (max-width:${BREAKPOINTS[name] - 0.02}px){${css}}`;
}

export function mediaBetween(min: BreakpointName, max: BreakpointName, css: string): string {
  return `@media (min-width:${BREAKPOINTS[min]}px) and (max-width:${BREAKPOINTS[max] - 0.02}px){${css}}`;
}

export function fluid(minSizePx: number, maxSizePx: number, minViewportPx = 360, maxViewportPx = 1440): string {
  if (maxViewportPx <= minViewportPx) {
    throw new Error("fluid requires maxViewportPx to be larger than minViewportPx.");
  }
  const slope = ((maxSizePx - minSizePx) / (maxViewportPx - minViewportPx)) * 100;
  const intercept = minSizePx - (slope / 100) * minViewportPx;
  return `clamp(${minSizePx}px, ${intercept.toFixed(4)}px + ${slope.toFixed(4)}vw, ${maxSizePx}px)`;
}

export function responsiveSizes(config: Partial<Record<BreakpointName, string>>, fallback = "100vw"): string {
  const ordered = Object.entries(BREAKPOINTS)
    .sort((a, b) => b[1] - a[1])
    .map(([name, width]) => {
      const value = config[name as BreakpointName];
      if (!value) return "";
      return `(min-width: ${width}px) ${value}`;
    })
    .filter(Boolean);
  ordered.push(fallback);
  return ordered.join(", ");
}

export function responsiveStyle(selector: string, baseCss: string, overrides: Partial<Record<BreakpointName, string>>): string {
  const blocks = [`${selector}{${baseCss}}`];
  for (const [name] of Object.entries(BREAKPOINTS)) {
    const css = overrides[name as BreakpointName];
    if (!css) continue;
    blocks.push(mediaUp(name as BreakpointName, `${selector}{${css}}`));
  }
  return `<style>${blocks.join("")}</style>`;
}
