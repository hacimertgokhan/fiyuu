import { escapeHtml } from "./template.js";

export interface OptimizedImageSource {
  srcSet: string;
  media?: string;
  type?: string;
  sizes?: string;
}

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  srcSet?: string;
  sources?: OptimizedImageSource[];
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  class?: string;
  style?: string;
  id?: string;
}

export interface OptimizedVideoSource {
  src: string;
  type?: string;
  media?: string;
}

export interface OptimizedVideoProps {
  src?: string;
  sources?: OptimizedVideoSource[];
  poster?: string;
  preload?: "none" | "metadata" | "auto";
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  width?: number;
  height?: number;
  class?: string;
  style?: string;
  id?: string;
}

export function optimizedImage(props: OptimizedImageProps): string {
  const loading = props.loading ?? "lazy";
  const decoding = props.decoding ?? "async";
  const fetchPriority = props.fetchPriority ?? "auto";
  const imageAttributes = [
    createAttribute("src", props.src),
    createAttribute("alt", props.alt),
    createAttribute("loading", loading),
    createAttribute("decoding", decoding),
    createAttribute("fetchpriority", fetchPriority),
    createAttribute("sizes", props.sizes),
    createAttribute("srcset", props.srcSet),
    createAttribute("width", props.width),
    createAttribute("height", props.height),
    createAttribute("class", props.class),
    createAttribute("style", props.style),
    createAttribute("id", props.id),
  ]
    .filter(Boolean)
    .join(" ");

  const sourceTags = (props.sources ?? [])
    .map((source) => {
      const attributes = [
        createAttribute("srcset", source.srcSet),
        createAttribute("media", source.media),
        createAttribute("type", source.type),
        createAttribute("sizes", source.sizes),
      ]
        .filter(Boolean)
        .join(" ");
      return `<source ${attributes}>`;
    })
    .join("");

  if (sourceTags.length > 0) {
    return `<picture>${sourceTags}<img ${imageAttributes}></picture>`;
  }

  return `<img ${imageAttributes}>`;
}

export function optimizedVideo(props: OptimizedVideoProps): string {
  const preload = props.preload ?? "metadata";
  const controls = props.controls ?? true;
  const playsInline = props.playsInline ?? true;
  const sources = props.sources && props.sources.length > 0
    ? props.sources
    : props.src
      ? [{ src: props.src }]
      : [];

  if (sources.length === 0) {
    throw new Error("optimizedVideo requires either `src` or `sources`.");
  }

  const videoAttributes = [
    createAttribute("poster", props.poster),
    createAttribute("preload", preload),
    createAttribute("width", props.width),
    createAttribute("height", props.height),
    createAttribute("class", props.class),
    createAttribute("style", props.style),
    createAttribute("id", props.id),
    controls ? "controls" : "",
    props.muted ? "muted" : "",
    props.loop ? "loop" : "",
    props.autoPlay ? "autoplay" : "",
    playsInline ? "playsinline" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const sourceTags = sources
    .map((source) => {
      const attributes = [
        createAttribute("src", source.src),
        createAttribute("type", source.type),
        createAttribute("media", source.media),
      ]
        .filter(Boolean)
        .join(" ");
      return `<source ${attributes}>`;
    })
    .join("");

  return `<video ${videoAttributes}>${sourceTags}</video>`;
}

function createAttribute(name: string, value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return `${name}="${escapeHtml(value)}"`;
}
