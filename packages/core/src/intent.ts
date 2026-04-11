/**
 * Intent-Based Programming for Fiyuu
 * 
 * Yazılımcı ne istediğini söyler, Fiyuu nasıl yapılacağını bilir.
 * AI-friendly, minimal syntax, maximum clarity.
 * 
 * @example
 * ```typescript
 * // app/users/page.ts
 * export default definePage({
 *   route: '/users',
 *   load: () => db.users.all(),
 *   render: ({ data }) => `<h1>${data.length} users</h1>`
 * });
 * ```
 */

import { z } from "zod";
import type { FiyuuConfig } from "./config.js";

// ============================================================================
// Core Types - AI ve yazılımcı için anlaşılır
// ============================================================================

// HttpMethod is imported from decorators/controller.ts
import type { HttpMethod } from "./decorators/controller.js";
export type { HttpMethod };

/** Render modları - ne zaman çalışacağı belli */
export type RenderMode = "ssr" | "csr" | "ssg" | "static" | "edge";

/** Temel context - her handler'da var */
export interface BaseContext {
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  cookies: Record<string, string>;
}

/** Intent sonucu - başarı veya hata */
export interface IntentResult<T, E = Error> {
  ok: boolean;
  data?: T;
  error?: E;
}

// ============================================================================
// Page Intent - Sayfa tanımı
// ============================================================================

/** Sayfa input validasyonu - Zod şeması */
export interface PageInput<P = unknown, Q = unknown> {
  params?: z.ZodSchema<P>;
  query?: z.ZodSchema<Q>;
}

/** Sayfa loader fonksiyonu - data çek */
export type PageLoader<T, P = unknown, Q = unknown> = (
  ctx: BaseContext & { params: P; query: Q }
) => Promise<T> | T;

/** Sayfa renderer - HTML üret */
export type PageRenderer<T> = (
  ctx: { data: T; error?: Error; loading: boolean }
) => string;

/** Sayfa meta bilgileri - SEO vb. */
export interface PageMeta {
  title?: string;
  description?: string;
  robots?: string;
  ogImage?: string;
  
  /** Canonical URL */
  canonical?: string;
  
  /** Open Graph - otomatik title/description'dan türetilir */
  og?: {
    title?: string;
    description?: string;
    image?: string;
    type?: "website" | "article" | "profile";
    url?: string;
  };
  
  /** Twitter Card */
  twitter?: {
    card?: "summary" | "summary_large_image";
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
  };
  
  /** Structured Data / JSON-LD */
  jsonLd?: Record<string, any> | Record<string, any>[];
  
  /** Dil ve bölge */
  lang?: string;
  locale?: string;
  
  /** Ek meta tag'ler */
  extra?: Record<string, string>;
}

/** Content'den SEO meta üret - AI destekli */
export interface SeoGenerator<T = unknown> {
  /** Sayfa content'inden title üret */
  generateTitle: (data: T, content?: string) => string;
  
  /** Sayfa content'inden description üret */
  generateDescription: (data: T, content?: string) => string;
  
  /** Content'den keywords öner */
  suggestKeywords: (data: T, content?: string) => string[];
  
  /** Otomatik OG image üret veya seç */
  generateOgImage?: (data: T, content?: string) => string;
  
  /** Structured data schema öner */
  suggestSchema?: (data: T, content?: string) => Record<string, any>;
}

/** SEO yapılandırması - Intent içinde */
export interface SeoConfig<T = unknown> {
  /** Statik meta veya dinamik üretici */
  meta?: PageMeta | ((data: T) => PageMeta);
  
  /** AI/otomatik SEO üretici */
  generate?: SeoGenerator<T>;
  
  /** Content'den otomatik SEO - render output'u analiz edilir */
  auto?: boolean | {
    /** Title için selector - h1, h2 vb. */
    titleSelector?: string;
    /** Description için selector - p, .description vb. */
    descSelector?: string;
    /** Image için selector - img[src], meta[property="og:image"] vb. */
    imageSelector?: string;
  };
  
  /** Multilingual - alternatif diller */
  alternates?: {
    languages?: Record<string, string>;
    canonical?: string;
  };
  
  /** Sitemap ayarları */
  sitemap?: {
    priority?: number;
    changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    lastmod?: string | Date;
  };
}

/** Sayfa tanımı - tek obje, her şey içinde */
export interface PageIntent<T = unknown, P = unknown, Q = unknown> {
  /** 
   * Route pattern: /users, /users/[id], /blog/[...slug]
   * Opsiyonel - verilmezse dosya path'inden infer edilir
   * app/users/page.ts → /users
   * app/users/[id]/page.ts → /users/:id
   */
  route?: string;

  /** HTTP method - varsayılan GET */
  method?: HttpMethod;

  /** Input validasyon */
  input?: PageInput<P, Q>;

  /** Data yükle - opsiyonel, yoksa static page */
  load?: PageLoader<T, P, Q>;

  /** HTML render et - opsiyonel, yoksa JSON response */
  render?: PageRenderer<T>;

  /** SEO ve meta bilgileri - dinamik content'den üretilir */
  seo?: SeoConfig<T>;

  /** Render modu */
  mode?: RenderMode;

  /** Cache süresi (saniye) - 0 = cache yok */
  cache?: number;

  /** Layout kullan - dosya path veya ad */
  layout?: string;

  /** Provider'lar - array of provider names */
  providers?: string[];

  /** Skeleton göster - yüklenirken */
  skeleton?: string | boolean;

  /** Error boundary kullan */
  errorBoundary?: boolean;
}

// ============================================================================
// API Intent - Endpoint tanımı
// ============================================================================

/** API input - body, params, query */
export interface ApiInput<B = unknown, P = unknown, Q = unknown> {
  body?: z.ZodSchema<B>;
  params?: z.ZodSchema<P>;
  query?: z.ZodSchema<Q>;
}

/** API handler - logic burada */
export type ApiHandler<T, B = unknown, P = unknown, Q = unknown> = (
  ctx: BaseContext & { body: B; params: P; query: Q }
) => Promise<T> | T;

/** API tanımı */
export interface ApiIntent<T = unknown, B = unknown, P = unknown, Q = unknown> {
  /** 
   * Route pattern
   * Opsiyonel - verilmezse dosya path'inden infer edilir
   * app/api/users.ts → /api/users
   */
  route?: string;

  /** HTTP method - varsayılan POST */
  method: HttpMethod;

  /** Input validasyon */
  input?: ApiInput<B, P, Q>;

  /** Handler fonksiyon */
  handler: ApiHandler<T, B, P, Q>;

  /** Response transform - son işlem */
  transform?: (data: T) => unknown;

  /** Rate limiting - req/saniye */
  rateLimit?: number;

  /** Auth gerekli mi */
  auth?: boolean | string[]; // true veya ["admin", "user"]

  /** Cache süresi */
  cache?: number;
}

// ============================================================================
// Component Intent - Reusable UI
// ============================================================================

/** Component props tanımı */
export interface ComponentProps<T = unknown> {
  schema?: z.ZodSchema<T>;
  required?: string[];
  defaults?: Partial<T>;
}

/** Component tanımı */
export interface ComponentIntent<P = unknown> {
  /** Component adı - PascalCase */
  name: string;

  /** Props validasyon */
  props?: ComponentProps<P>;

  /** Server-side render - HTML string */
  serverRender?: (props: P) => string;

  /** Client-side hydrate - JS kodu */
  clientRender?: (props: P) => string;

  /** CSS styles */
  styles?: string;

  /** Client'da çalışacak script */
  script?: string;

  /** Island stratejisi */
  island?: "load" | "visible" | "idle" | "interaction" | "media";
}

// ============================================================================
// Layout Intent - Page wrapper
// ============================================================================

/** Layout slot'ları */
export interface LayoutSlots {
  head?: string;
  body: string;
  footer?: string;
  scripts?: string;
}

/** Layout tanımı */
export interface LayoutIntent {
  /** Layout adı */
  name: string;

  /** Wrapper fonksiyonu - children'i sarmalar */
  wrapper: (slots: LayoutSlots, context: BaseContext) => string;

  /** Global provider'lar - tüm sayfalara uygulanır */
  providers?: string[];

  /** Global styles */
  styles?: string[];

  /** Global scripts */
  scripts?: string[];
}

// ============================================================================
// Intent Factory Functions
// ============================================================================

/**
 * Sayfa tanımla - intent-based approach
 * 
 * @example
 * ```typescript
 * export default definePage({
 *   route: '/users/[id]',
 *   input: {
 *     params: z.object({ id: z.string() })
 *   },
 *   load: async ({ params }) => db.users.find(params.id),
 *   render: ({ data, error }) => error 
 *     ? `<p>Error</p>` 
 *     : `<h1>${data.name}</h1>`
 * });
 * ```
 */
export function definePage<T, P = unknown, Q = unknown>(
  intent: PageIntent<T, P, Q>
): PageIntent<T, P, Q> {
  // Validasyon ve defaults
  return {
    method: "GET",
    mode: "ssr",
    cache: 0,
    errorBoundary: true,
    ...intent,
  };
}

/**
 * API endpoint tanımla
 * 
 * @example
 * ```typescript
 * export default defineApi({
 *   route: '/api/users',
 *   method: 'POST',
 *   input: {
 *     body: z.object({ name: z.string() })
 *   },
 *   handler: async ({ body }) => {
 *     return db.users.create(body);
 *   }
 * });
 * ```
 */
export function defineApi<T, B = unknown, P = unknown, Q = unknown>(
  intent: ApiIntent<T, B, P, Q>
): ApiIntent<T, B, P, Q> {
  return {
    auth: false,
    ...intent,
    method: intent.method ?? "POST",
  };
}

/**
 * Component tanımla
 * 
 * @example
 * ```typescript
 * export default defineComponent({
 *   name: 'UserCard',
 *   props: {
 *     schema: z.object({ name: z.string(), age: z.number() })
 *   },
 *   serverRender: ({ name, age }) => `
 *     <div class="user-card">
 *       <h3>${name}</h3>
 *       <p>${age} years old</p>
 *     </div>
 *   `
 * });
 * ```
 */
export function defineComponent<P = unknown>(
  intent: ComponentIntent<P>
): ComponentIntent<P> {
  return {
    island: "load",
    ...intent,
  };
}

/**
 * Layout tanımla
 * 
 * @example
 * ```typescript
 * export default defineLayout({
 *   name: 'default',
 *   wrapper: ({ body, head }) => `
 *     <!DOCTYPE html>
 *     <html>
 *       <head>${head}</head>
 *       <body>${body}</body>
 *     </html>
 *   `
 * });
 * ```
 */
export function defineLayout(intent: LayoutIntent): LayoutIntent {
  return intent;
}

// ============================================================================
// Utility Functions - Syntax içinde boğulma
// ============================================================================

/**
 * HTML template literal - JSX ceremony yok
 * 
 * @example
 * ```typescript
 * html`<div class="${className}">${content}</div>`
 * ```
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return strings.reduce((result, str, i) => {
    const value = values[i];
    if (value === undefined || value === null) return result + str;
    
    // Array'leri flatMap et
    if (Array.isArray(value)) {
      return result + str + value.join("");
    }
    
    // Primitive'leri escape et (XSS koruması)
    if (typeof value === "string") {
      return result + str + escapeHtml(value);
    }
    
    return result + str + String(value);
  }, "");
}

/** HTML escape - güvenlik */
function escapeHtml(text: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Server-side fallback
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * CSS template literal - syntax highlight için
 * 
 * @example
 * ```typescript
 * css`
 *   .user-card {
 *     padding: 1rem;
 *     border: 1px solid #ccc;
 *   }
 * `
 * ```
 */
export function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] ?? "");
  }, "");
}

/**
 * Condition render - if/else ceremony yok
 * 
 * @example
 * ```typescript
 * render: ({ data }) => html`
 *   ${when(data.length > 0, 
 *     () => html`<ul>${data.map(...)}</ul>`,
 *     () => html`<p>No data</p>`
 *   )}
 * `
 * ```
 */
export function when<T>(
  condition: boolean,
  thenFn: () => T,
  elseFn?: () => T
): T | undefined {
  if (condition) return thenFn();
  return elseFn?.();
}

/**
 * Async data render - loading/error/başarı state'leri
 * 
 * @example
 * ```typescript
 * render: async ({ data }) => await match(data, {
 *   loading: () => `<p>Loading...</p>`,
 *   error: (e) => `<p>Error: ${e.message}</p>`,
 *   success: (users) => `<ul>${users.map(...)}</ul>`
 * })
 * ```
 */
export function match<T, R>(
  result: IntentResult<T>,
  handlers: {
    loading?: () => R;
    error?: (e: Error) => R;
    success?: (data: T) => R;
    empty?: () => R;
  }
): R | undefined {
  if (!result.ok && result.error) {
    return handlers.error?.(result.error);
  }
  if (result.data === undefined || result.data === null) {
    return handlers.empty?.();
  }
  if (Array.isArray(result.data) && result.data.length === 0) {
    return handlers.empty?.();
  }
  return handlers.success?.(result.data);
}

// ============================================================================
// Intent Registry - Runtime discovery
// ============================================================================

/** Global intent registry - tarayıcıda veya build time'da */
const intentRegistry = {
  pages: new Map<string, PageIntent>(),
  apis: new Map<string, ApiIntent>(),
  components: new Map<string, ComponentIntent>(),
  layouts: new Map<string, LayoutIntent>(),
};

/** Intent'i registry'e kaydet */
export function registerPage(intent: PageIntent): void {
  if (intent.route) {
    intentRegistry.pages.set(intent.route, intent);
  }
}

export function registerApi(intent: ApiIntent): void {
  if (intent.route && intent.method) {
    const key = `${intent.method}:${intent.route}`;
    intentRegistry.apis.set(key, intent);
  }
}

export function registerComponent(intent: ComponentIntent): void {
  intentRegistry.components.set(intent.name, intent);
}

export function registerLayout(intent: LayoutIntent): void {
  intentRegistry.layouts.set(intent.name, intent);
}

/** Registry'den intent al */
export function getPage(route: string): PageIntent | undefined {
  return intentRegistry.pages.get(route);
}

export function getApi(method: string, route: string): ApiIntent | undefined {
  return intentRegistry.apis.get(`${method}:${route}`);
}

export function getComponent(name: string): ComponentIntent | undefined {
  return intentRegistry.components.get(name);
}

export function getLayout(name: string): LayoutIntent | undefined {
  return intentRegistry.layouts.get(name);
}

/** Tüm intent'leri listele - AI için */
export function listIntents(): {
  pages: string[];
  apis: string[];
  components: string[];
  layouts: string[];
} {
  return {
    pages: Array.from(intentRegistry.pages.keys()),
    apis: Array.from(intentRegistry.apis.keys()),
    components: Array.from(intentRegistry.components.keys()),
    layouts: Array.from(intentRegistry.layouts.keys()),
  };
}

// ============================================================================
// Action Intent - Server Actions for Forms
// ============================================================================

/** Form field validasyonu */
export interface FormField<T = unknown> {
  type: "text" | "email" | "number" | "date" | "boolean" | "file" | "select";
  label?: string;
  placeholder?: string;
  required?: boolean;
  validate?: z.ZodSchema<T>;
  options?: { value: string; label: string }[]; // select için
}

/** Action handler - form submission */
export type ActionHandler<T = unknown, R = unknown> = (
  data: T,
  context: BaseContext
) => Promise<{ success: true; data: R } | { success: false; errors: Record<string, string> }>;

/** Action intent - form + server logic */
export interface ActionIntent<T = unknown, R = unknown> {
  /** Action adı - form action attribute'u */
  name: string;

  /** Form fields - otomatik form UI üretimi için */
  fields: Record<string, FormField>;

  /** Handler - form submit edilince çalışır */
  handler: ActionHandler<T, R>;

  /** Başarılı olunca yönlendir */
  redirect?: string | ((result: R) => string);

  /** Başarılı olunca toast mesajı */
  successMessage?: string;

  /** Validasyon hatası mesajı */
  errorMessage?: string;

  /** Rate limit - dakika başına max istek */
  rateLimit?: number;

  /** CSRF koruması */
  csrf?: boolean;
}

/** Action tanımla */
export function defineAction<T = unknown, R = unknown>(
  intent: ActionIntent<T, R>
): ActionIntent<T, R> {
  return {
    csrf: true,
    ...intent,
  };
}

// ============================================================================
// Caching & Memoization
// ============================================================================

/** Cache stratejisi */
export type CacheStrategy = 
  | "memory"      // RAM'de tut, process restart'ta silinir
  | "filesystem"  // Disk'e yaz, sunucu restart'ta kalır
  | "redis"       // Redis/SQLite/KV store
  | "edge";       // CDN/Edge cache (Vercel, Cloudflare)

/** Cache key üretici */
export type CacheKey<T = unknown> = (input: T) => string;

/** Cache options */
export interface CacheOptions<T = unknown> {
  /** TTL saniye cinsinden - 0 = sonsuz */
  ttl?: number;
  
  /** Cache stratejisi */
  strategy?: CacheStrategy;
  
  /** Özel cache key */
  key?: string | CacheKey<T>;
  
  /** Tags - gruplu invalidation için */
  tags?: string[];
  
  /** Cache'i pas geçme koşulu */
  skip?: (input: T) => boolean;
  
  /** Stale-while-revalidate - eski datayı göster, arka planda yenile */
  swr?: boolean;
}

/** Cache invalidate options */
export interface InvalidateOptions {
  /** Belirli key'leri sil */
  keys?: string[];
  
  /** Belirli tag'leri sil */
  tags?: string[];
  
  /** Hepsini sil */
  all?: boolean;
  
  /** Pattern match (glob) */
  pattern?: string;
}

// ============================================================================
// Memo Decorator / Wrapper
// ============================================================================

/**
 * Fonksiyonu memoize et - aynı input, aynı output
 * 
 * @example
 * ```typescript
 * const getUser = memo(
 *   async (id: string) => db.users.find(id),
 *   { ttl: 60, tags: ["users"] }
 * );
 * 
 * // İlk çağrı DB'den
 * const user1 = await getUser("123");
 * 
 * // İkinci çağrı cache'den (60 saniye içinde)
 * const user2 = await getUser("123");
 * ```
 */
export function memo<T extends (...args: any[]) => any>(
  fn: T,
  options?: CacheOptions<Parameters<T>>
): T {
  const cache = new Map<string, { value: ReturnType<T>; expires: number }>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = typeof options?.key === "function" 
      ? options.key(args)
      : options?.key || JSON.stringify(args);
    
    const cached = cache.get(key);
    const now = Date.now();
    
    // Skip kontrolü
    if (options?.skip?.(args)) {
      return fn(...args);
    }
    
    // Cache hit ve süresi dolmamış
    if (cached && cached.expires > now) {
      return cached.value;
    }
    
    // Cache miss veya expired
    const result = fn(...args);
    const ttl = options?.ttl ?? 0;
    
    cache.set(key, {
      value: result,
      expires: ttl > 0 ? now + ttl * 1000 : Infinity,
    });
    
    return result;
  }) as T;
}

/**
 * Async fonksiyonu memoize et
 * 
 * @example
 * ```typescript
 * const fetchData = memoAsync(
 *   async (url: string) => {
 *     const res = await fetch(url);
 *     return res.json();
 *   },
 *   { ttl: 300, strategy: "memory" }
 * );
 * ```
 */
export function memoAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: CacheOptions<Parameters<T>>
): T {
  const cache = new Map<string, { 
    promise: Promise<any>; 
    value?: any;
    expires: number;
  }>();
  
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = typeof options?.key === "function" 
      ? options.key(args)
      : options?.key || JSON.stringify(args);
    
    const cached = cache.get(key);
    const now = Date.now();
    
    // Skip kontrolü
    if (options?.skip?.(args)) {
      return fn(...args);
    }
    
    // Cache hit
    if (cached) {
      // SWR modu: eski datayı döndür, arka planda yenile
      if (options?.swr && cached.expires <= now) {
        // Arka planda yenile
        Promise.resolve().then(async () => {
          try {
            const fresh = await fn(...args);
            cache.set(key, {
              promise: Promise.resolve(fresh),
              value: fresh,
              expires: now + (options?.ttl ?? 300) * 1000,
            });
          } catch (e) {
            // Silent fail, eski data kullanılır
          }
        });
        return cached.value ?? cached.promise;
      }
      
      // Normal cache hit
      if (cached.expires > now) {
        return cached.value ?? cached.promise;
      }
    }
    
    // Cache miss
    const promise = fn(...args).then((value: any) => {
      const ttl = options?.ttl ?? 300;
      cache.set(key, {
        promise: Promise.resolve(value),
        value,
        expires: ttl > 0 ? now + ttl * 1000 : Infinity,
      });
      return value;
    });
    
    cache.set(key, {
      promise,
      value: undefined,
      expires: (options?.ttl ?? 300) > 0 
        ? now + (options?.ttl ?? 300) * 1000 
        : Infinity,
    });
    
    return promise;
  }) as T;
}

/**
 * Cache'i temizle
 * 
 * @example
 * ```typescript
 * // Belirli key'i sil
 * invalidate(getUser, { keys: ["123"] });
 * 
 * // Tag'e göre sil
 * invalidate(getUser, { tags: ["users"] });
 * 
 * // Hepsini sil
 * invalidate(getUser, { all: true });
 * ```
 */
export function invalidate(
  fn: Function,
  options: InvalidateOptions
): void {
  // Implementation depends on storage strategy
  // For now, this is a placeholder that would integrate with
  // the actual cache storage in runtime
  console.log("[Cache] Invalidate:", options);
}

// ============================================================================
// Page-Level Caching (ISR/SSG)
// ============================================================================

/** Page cache configuration */
export interface PageCacheConfig {
  /** Cache süresi (saniye) - ISR için */
  revalidate?: number;
  
  /** Build time'da generate et (SSG) */
  static?: boolean;
  
  /** Edge cache - CDN için */
  edge?: {
    ttl: number;
    staleWhileRevalidate?: number;
  };
  
  /** Vary by headers/cookies */
  vary?: {
    headers?: string[];
    cookies?: string[];
    query?: string[];
  };
  
  /** Cache tags - invalidation için */
  tags?: string[];
}

// ============================================================================
// File Path → Route Inference
// ============================================================================

/**
 * Dosya path'inden route pattern'i çıkar
 * 
 * app/users/page.ts → /users
 * app/users/[id]/page.ts → /users/:id
 * app/api/users.ts → /api/users
 * app/blog/[...slug]/page.ts → /blog/*
 */
export function inferRouteFromPath(filePath: string): string {
  // Normalize path
  let route = filePath
    .replace(/\\/g, "/") // Windows path'leri
    .replace(/^.*\/app\//, "/") // app/ prefix'ini kaldır
    .replace(/\/(page|layout|api|action)\.(ts|tsx|js|jsx)$/, "") // file extension ve type
    .replace(/\/$/, ""); // trailing slash

  // [param] → :param
  route = route.replace(/\[(\w+)\]/g, ":$1");

  // [...param] → *
  route = route.replace(/\[\.{3}(\w+)\]/g, "*$1");

  // [[...param]] → * (optional catch-all)
  route = route.replace(/\[\[\.{3}(\w+)\]\]/g, "*$1");

  return route || "/";
}

// ============================================================================
// SEO Utilities - Content'den meta üret
// ============================================================================

/**
 * HTML content'den text çıkar - SEO için
 */
export function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Content'den title çıkar - h1 veya ilk başlık
 */
export function extractTitle(html: string, fallback?: string): string {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return extractTextFromHtml(h1Match[1]).slice(0, 60);
  }
  
  const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i);
  if (h2Match) {
    return extractTextFromHtml(h2Match[1]).slice(0, 60);
  }
  
  return fallback || "";
}

/**
 * Content'den description çıkar - ilk paragraf
 */
export function extractDescription(html: string, maxLength = 160): string {
  const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
  if (pMatch) {
    const text = extractTextFromHtml(pMatch[1]).slice(0, maxLength);
    return text.length === maxLength ? text + "..." : text;
  }
  
  // Hiç p yoksa, tüm text'den al
  const text = extractTextFromHtml(html).slice(0, maxLength);
  return text.length === maxLength ? text + "..." : text;
}

/**
 * Content'den ilk image URL'si çıkar - OG image için
 */
export function extractImage(html: string): string | undefined {
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return imgMatch?.[1];
}

/**
 * Otomatik SEO meta üret - render output'undan
 */
export function generateSeoFromContent(
  html: string,
  baseUrl: string,
  path: string,
  overrides?: Partial<PageMeta>
): PageMeta {
  const title = overrides?.title || extractTitle(html, "Untitled");
  const description = overrides?.description || extractDescription(html);
  const image = overrides?.ogImage || extractImage(html);
  const url = baseUrl + path;
  
  return {
    title,
    description,
    ogImage: image,
    canonical: url,
    og: {
      title,
      description,
      image,
      type: "website",
      url,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      image,
    },
    ...overrides,
  };
}

/**
 * JSON-LD structured data üret
 */
export function generateJsonLd(
  type: "WebPage" | "Article" | "Person" | "Organization" | "Product",
  data: Record<string, any>
): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
}

/**
 * Meta tag'leri HTML'e render et
 */
export function renderMetaTags(meta: PageMeta): string {
  const tags: string[] = [];
  
  // Temel meta
  if (meta.title) {
    tags.push(`<title>${escapeHtml(meta.title)}</title>`);
    tags.push(`<meta property="og:title" content="${escapeHtml(meta.title)}" />`);
    tags.push(`<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`);
  }
  
  if (meta.description) {
    tags.push(`<meta name="description" content="${escapeHtml(meta.description)}" />`);
    tags.push(`<meta property="og:description" content="${escapeHtml(meta.description)}" />`);
    tags.push(`<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`);
  }
  
  if (meta.canonical) {
    tags.push(`<link rel="canonical" href="${meta.canonical}" />`);
    tags.push(`<meta property="og:url" content="${meta.canonical}" />`);
  }
  
  if (meta.robots) {
    tags.push(`<meta name="robots" content="${meta.robots}" />`);
  }
  
  if (meta.ogImage) {
    tags.push(`<meta property="og:image" content="${meta.ogImage}" />`);
    tags.push(`<meta name="twitter:image" content="${meta.ogImage}" />`);
  }
  
  // Open Graph
  if (meta.og?.type) {
    tags.push(`<meta property="og:type" content="${meta.og.type}" />`);
  }
  
  // Twitter
  if (meta.twitter?.card) {
    tags.push(`<meta name="twitter:card" content="${meta.twitter.card}" />`);
  }
  if (meta.twitter?.site) {
    tags.push(`<meta name="twitter:site" content="${meta.twitter.site}" />`);
  }
  
  // Dil
  if (meta.lang) {
    tags.push(`<html lang="${meta.lang}">`);
  }
  
  // JSON-LD
  if (meta.jsonLd) {
    const schemas = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
    schemas.forEach((schema) => {
      tags.push(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
    });
  }
  
  // Ekstra meta
  if (meta.extra) {
    Object.entries(meta.extra).forEach(([name, content]) => {
      tags.push(`<meta name="${name}" content="${content}" />`);
    });
  }
  
  return tags.join("\n");
}

// ============================================================================
// Type Helpers - TypeScript inference
// ============================================================================

/** Infer page data type */
export type InferPageData<T> = T extends PageIntent<infer D> ? D : never;

/** Infer page params type */
export type InferPageParams<T> = T extends PageIntent<unknown, infer P> ? P : never;

/** Infer API body type */
export type InferApiBody<T> = T extends ApiIntent<unknown, infer B> ? B : never;

/** Infer component props type */
export type InferComponentProps<T> = T extends ComponentIntent<infer P> ? P : never;
