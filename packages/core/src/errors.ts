/**
 * Error handling and fallback management for Fiyuu.
 *
 * Provides typed errors, error boundaries, and skeleton UI support.
 */

export type ErrorSeverity = "info" | "warning" | "error" | "fatal";

export interface FiyuuError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Which component/feature caused the error */
  source: string;
  /** Route where error occurred */
  route?: string;
  /** Timestamp */
  timestamp: number;
  /** Original error if any */
  originalError?: Error;
  /** Additional context */
  context?: Record<string, unknown>;
}

export interface ErrorBoundaryConfig {
  /** Whether to show error details in UI */
  showDetails: boolean;
  /** Whether to log errors to console */
  logToConsole: boolean;
  /** Custom error handler */
  onError?: (error: FiyuuError) => void;
  /** Fallback component render function */
  fallback?: (error: FiyuuError, retry: () => void) => string;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelayMs: number;
}

export interface SkeletonConfig {
  /** Default skeleton placeholder */
  default: string;
  /** Named skeleton variants */
  variants: Record<string, string>;
  /** Whether to fade in actual content */
  fadeIn: boolean;
  /** Fade duration in milliseconds */
  fadeDurationMs: number;
}

export interface ErrorHandlerResult {
  /** Whether error was handled */
  handled: boolean;
  /** Fallback content to render */
  fallback?: string;
  /** Whether to retry */
  shouldRetry: boolean;
  /** Retry count */
  retryCount: number;
}

/** Predefined error codes */
export const ErrorCodes = {
  // Query errors
  QUERY_NOT_FOUND: "QUERY_NOT_FOUND",
  QUERY_EXECUTION_FAILED: "QUERY_EXECUTION_FAILED",
  QUERY_TIMEOUT: "QUERY_TIMEOUT",
  QUERY_INVALID_PARAMS: "QUERY_INVALID_PARAMS",

  // Action errors
  ACTION_NOT_FOUND: "ACTION_NOT_FOUND",
  ACTION_EXECUTION_FAILED: "ACTION_EXECUTION_FAILED",
  ACTION_VALIDATION_FAILED: "ACTION_VALIDATION_FAILED",
  ACTION_UNAUTHORIZED: "ACTION_UNAUTHORIZED",

  // Component errors
  COMPONENT_RENDER_FAILED: "COMPONENT_RENDER_FAILED",
  COMPONENT_NOT_FOUND: "COMPONENT_NOT_FOUND",
  COMPONENT_PROPS_INVALID: "COMPONENT_PROPS_INVALID",

  // Provider errors
  PROVIDER_INIT_FAILED: "PROVIDER_INIT_FAILED",
  PROVIDER_NOT_FOUND: "PROVIDER_NOT_FOUND",

  // Layout errors
  LAYOUT_NOT_FOUND: "LAYOUT_NOT_FOUND",
  LAYOUT_RENDER_FAILED: "LAYOUT_RENDER_FAILED",

  // Asset errors
  ASSET_NOT_FOUND: "ASSET_NOT_FOUND",
  ASSET_ACCESS_DENIED: "ASSET_ACCESS_DENIED",
  ASSET_LOAD_FAILED: "ASSET_LOAD_FAILED",

  // Server errors
  SERVER_INTERNAL_ERROR: "SERVER_INTERNAL_ERROR",
  SERVER_TIMEOUT: "SERVER_TIMEOUT",
  SERVER_RATE_LIMITED: "SERVER_RATE_LIMITED",

  // Validation errors
  VALIDATION_SCHEMA_INVALID: "VALIDATION_SCHEMA_INVALID",
  VALIDATION_INPUT_INVALID: "VALIDATION_INPUT_INVALID",

  // Network errors
  NETWORK_OFFLINE: "NETWORK_OFFLINE",
  NETWORK_REQUEST_FAILED: "NETWORK_REQUEST_FAILED",
  NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** Create a typed Fiyuu error */
export function createError(
  code: ErrorCode,
  message: string,
  options?: {
    severity?: ErrorSeverity;
    source?: string;
    route?: string;
    originalError?: Error;
    context?: Record<string, unknown>;
  },
): FiyuuError {
  return {
    code,
    message,
    severity: options?.severity ?? "error",
    source: options?.source ?? "unknown",
    route: options?.route,
    timestamp: Date.now(),
    originalError: options?.originalError,
    context: options?.context,
  };
}

/** Default error boundary fallback */
export function defaultErrorFallback(error: FiyuuError, retry: () => void): string {
  const severityColors: Record<ErrorSeverity, string> = {
    info: "#3a624b",
    warning: "#695834",
    error: "#7f3e3e",
    fatal: "#5c1f1f",
  };

  const bgColors: Record<ErrorSeverity, string> = {
    info: "#e4ebdf",
    warning: "#e8e2d4",
    error: "#f2dfd5",
    fatal: "#ebd4d4",
  };

  const color = severityColors[error.severity];
  const bgColor = bgColors[error.severity];

  return `
    <div style="
      padding: 16px 20px;
      background: ${bgColor};
      border: 1px solid ${color}33;
      border-radius: 8px;
      font-family: ui-sans-serif, system-ui, sans-serif;
      margin: 8px 0;
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: ${color};
        font-weight: 600;
        font-size: 14px;
      ">
        <span>⚠️</span>
        <span>${escapeHtml(error.code)}</span>
      </div>
      <p style="
        margin: 0 0 12px 0;
        color: #18211d;
        font-size: 13px;
        line-height: 1.5;
      ">${escapeHtml(error.message)}</p>
      ${error.source !== "unknown" ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 11px;">Source: ${escapeHtml(error.source)}</p>` : ""}
      <button 
        onclick="this.closest('[data-error-boundary]').dispatchEvent(new CustomEvent('fiyuu:retry'))"
        style="
          padding: 6px 12px;
          background: ${color};
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 500;
        "
      >Retry</button>
    </div>
  `.trim();
}

/** Default skeleton placeholder */
export function defaultSkeleton(variant?: string): string {
  const variants: Record<string, string> = {
    text: `<span style="display:inline-block;width:120px;height:1em;background:#e5e5e5;border-radius:4px;animation:pulse 2s infinite;"></span>`,
    title: `<div style="width:60%;height:1.5em;background:#e5e5e5;border-radius:4px;margin:8px 0;animation:pulse 2s infinite;"></div>`,
    paragraph: `<div style="width:100%;height:80px;background:#e5e5e5;border-radius:4px;margin:8px 0;animation:pulse 2s infinite;"></div>`,
    image: `<div style="width:100%;aspect-ratio:16/9;background:#e5e5e5;border-radius:8px;animation:pulse 2s infinite;"></div>`,
    card: `<div style="padding:16px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;animation:pulse 2s infinite;"><div style="width:40%;height:1.2em;background:#e5e5e5;border-radius:4px;margin-bottom:12px;"></div><div style="width:100%;height:60px;background:#e5e5e5;border-radius:4px;"></div></div>`,
    button: `<span style="display:inline-block;width:100px;height:36px;background:#e5e5e5;border-radius:6px;animation:pulse 2s infinite;"></span>`,
    avatar: `<span style="display:inline-block;width:40px;height:40px;background:#e5e5e5;border-radius:50%;animation:pulse 2s infinite;"></span>`,
  };

  return variants[variant ?? "card"] ?? variants.card;
}

/** Skeleton with pulse animation styles */
export function skeletonStyles(): string {
  return `
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .fiyuu-skeleton {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      .fiyuu-skeleton-text {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    </style>
  `;
}

/** Error boundary wrapper - wraps content with error handling */
export function wrapWithErrorBoundary(
  content: string,
  options: {
    id: string;
    fallback?: (error: FiyuuError, retry: () => void) => string;
    source: string;
  },
): string {
  const boundaryId = `error-boundary-${options.id}`;

  return `
    <div 
      data-error-boundary="${boundaryId}"
      data-error-source="${escapeHtml(options.source)}"
      style="position:relative;"
    >
      <div data-error-boundary-content="${boundaryId}">
        ${content}
      </div>
      <div 
        data-error-boundary-fallback="${boundaryId}" 
        style="display:none;"
      ></div>
    </div>
    <script>
      (function() {
        const boundary = document.querySelector('[data-error-boundary="${boundaryId}"]');
        const content = document.querySelector('[data-error-boundary-content="${boundaryId}"]');
        const fallback = document.querySelector('[data-error-boundary-fallback="${boundaryId}"]');
        
        if (!boundary || !content || !fallback) return;
        
        boundary.addEventListener('fiyuu:error', function(e) {
          const error = e.detail;
          content.style.display = 'none';
          fallback.style.display = 'block';
          fallback.innerHTML = ${JSON.stringify(
            (options.fallback ?? defaultErrorFallback)(
              createError(ErrorCodes.COMPONENT_RENDER_FAILED, "Component error", { source: options.source }),
              () => {},
            ),
          )};
        });
        
        boundary.addEventListener('fiyuu:retry', function() {
          content.style.display = 'block';
          fallback.style.display = 'none';
          fallback.innerHTML = '';
          // Dispatch retry event for framework to handle
          boundary.dispatchEvent(new CustomEvent('fiyuu:retry-request', { 
            detail: { boundaryId: '${boundaryId}', source: '${options.source}' }
          }));
        });
      })();
    </script>
  `;
}

/** Wrap content with skeleton loading state */
export function wrapWithSkeleton(
  content: string,
  options: {
    id: string;
    skeleton?: string;
    minDisplayMs?: number;
  },
): string {
  const skeletonId = `skeleton-${options.id}`;
  const minDisplayMs = options.minDisplayMs ?? 200;

  return `
    <div data-skeleton-wrapper="${skeletonId}" style="position:relative;">
      <div 
        data-skeleton-placeholder="${skeletonId}"
        style="transition:opacity 0.3s ease;"
      >
        ${skeletonStyles()}
        ${options.skeleton ?? defaultSkeleton()}
      </div>
      <div 
        data-skeleton-content="${skeletonId}"
        style="opacity:0;transition:opacity ${minDisplayMs}ms ease;position:absolute;top:0;left:0;width:100%;"
      >
        ${content}
      </div>
    </div>
    <script>
      (function() {
        const startTime = performance.now();
        const minDisplay = ${minDisplayMs};
        
        requestAnimationFrame(function() {
          const placeholder = document.querySelector('[data-skeleton-placeholder="${skeletonId}"]');
          const content = document.querySelector('[data-skeleton-content="${skeletonId}"]');
          
          if (!placeholder || !content) return;
          
          const elapsed = performance.now() - startTime;
          const remaining = Math.max(0, minDisplay - elapsed);
          
          setTimeout(function() {
            placeholder.style.opacity = '0';
            content.style.position = 'static';
            content.style.opacity = '1';
            setTimeout(function() {
              placeholder.style.display = 'none';
            }, 300);
          }, remaining);
        });
      })();
    </script>
  `;
}

/** Helper for conditional rendering based on error state */
export function ifAnyError<T>(
  fn: () => T,
  options?: {
    fallback?: T;
    onError?: (error: FiyuuError) => void;
    source?: string;
  },
): { result: T | undefined; error: FiyuuError | null; hasError: boolean } {
  try {
    const result = fn();
    return { result, error: null, hasError: false };
  } catch (err) {
    const error = createError(
      ErrorCodes.COMPONENT_RENDER_FAILED,
      err instanceof Error ? err.message : "Unknown error",
      {
        severity: "error",
        source: options?.source ?? "ifAnyError",
        originalError: err instanceof Error ? err : undefined,
      },
    );

    if (options?.onError) {
      options.onError(error);
    }

    return {
      result: options?.fallback,
      error,
      hasError: true,
    };
  }
}

/** Async version of ifAnyError */
export async function ifAnyErrorAsync<T>(
  fn: () => Promise<T>,
  options?: {
    fallback?: T;
    onError?: (error: FiyuuError) => void;
    source?: string;
  },
): Promise<{ result: T | undefined; error: FiyuuError | null; hasError: boolean }> {
  try {
    const result = await fn();
    return { result, error: null, hasError: false };
  } catch (err) {
    const error = createError(
      ErrorCodes.COMPONENT_RENDER_FAILED,
      err instanceof Error ? err.message : "Unknown error",
      {
        severity: "error",
        source: options?.source ?? "ifAnyErrorAsync",
        originalError: err instanceof Error ? err : undefined,
      },
    );

    if (options?.onError) {
      options.onError(error);
    }

    return {
      result: options?.fallback,
      error,
      hasError: true,
    };
  }
}

/** Try to render with fallback */
export function tryRender(
  renderFn: () => string,
  options?: {
    fallback?: string;
    skeleton?: string;
    errorBoundary?: boolean;
    source?: string;
  },
): string {
  // If skeleton is provided, wrap with skeleton first
  if (options?.skeleton) {
    const content = options.errorBoundary
      ? wrapWithErrorBoundary(renderFn(), { id: Math.random().toString(36).slice(2), source: options.source ?? "tryRender" })
      : renderFn();

    return wrapWithSkeleton(content, {
      id: Math.random().toString(36).slice(2),
      skeleton: options.skeleton,
    });
  }

  // If error boundary is enabled, wrap with error boundary
  if (options?.errorBoundary) {
    return wrapWithErrorBoundary(renderFn(), {
      id: Math.random().toString(36).slice(2),
      source: options.source ?? "tryRender",
    });
  }

  // Otherwise, use ifAnyError for simple error handling
  const { result, error } = ifAnyError(renderFn, {
    fallback: options?.fallback,
    source: options?.source,
  });

  if (error && !options?.fallback) {
    return defaultErrorFallback(error, () => {});
  }

  return result ?? "";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
