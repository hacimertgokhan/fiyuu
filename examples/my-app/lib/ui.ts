/**
 * shadcn/ui-inspired component builders for Fiyuu GEA templates.
 * Returns HTML strings to be interpolated into html`` tagged templates.
 */

import { escapeHtml } from "@fiyuu/core/client";

// ── Button ────────────────────────────────────────────────────────────────────

export function btn(
  label: string,
  opts: {
    type?: "button" | "submit";
    variant?: "primary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    attrs?: string;
  } = {},
): string {
  const { type = "button", variant = "primary", size = "md", attrs = "" } = opts;

  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2";

  const variants: Record<string, string> = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-700 shadow-sm",
    outline: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 shadow-sm",
    ghost: "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
    danger: "bg-red-600 text-white hover:bg-red-500 shadow-sm",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  return `<button type="${type}" class="${base} ${variants[variant]} ${sizes[size]}" ${attrs}>${escapeHtml(label)}</button>`;
}

// ── Input ─────────────────────────────────────────────────────────────────────

export function input(opts: {
  id: string;
  name?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  label?: string;
}): string {
  const { id, name = id, type = "text", placeholder = "", value = "", required = false, label } = opts;
  const labelHtml = label
    ? `<label for="${escapeHtml(id)}" class="block text-sm font-medium text-zinc-700 mb-1.5">${escapeHtml(label)}</label>`
    : "";
  return `
    <div class="flex flex-col">
      ${labelHtml}
      <input
        id="${escapeHtml(id)}"
        name="${escapeHtml(name)}"
        type="${escapeHtml(type)}"
        placeholder="${escapeHtml(placeholder)}"
        value="${escapeHtml(value)}"
        ${required ? "required" : ""}
        class="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
      />
    </div>`;
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function card(content: string, cls = ""): string {
  return `<div class="rounded-xl border border-zinc-200 bg-white shadow-sm ${cls}">${content}</div>`;
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export function badge(
  label: string,
  variant: "default" | "muted" | "success" | "warning" = "default",
): string {
  const variants: Record<string, string> = {
    default: "bg-zinc-900 text-white",
    muted: "bg-zinc-100 text-zinc-600",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
  };
  return `<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variants[variant]}">${escapeHtml(label)}</span>`;
}

// ── Alert ─────────────────────────────────────────────────────────────────────

export function alert(message: string, type: "error" | "success" | "info" = "info"): string {
  if (!message) return "";
  const styles: Record<string, string> = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };
  return `<div class="rounded-lg border px-4 py-3 text-sm ${styles[type]}">${escapeHtml(message)}</div>`;
}

// ── Divider ───────────────────────────────────────────────────────────────────

export const divider = `<div class="border-t border-zinc-100 my-6"></div>`;

// ── Format helpers ────────────────────────────────────────────────────────────

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(timestamp);
}
