/**
 * Pure utility functions for the Fiyuu runtime server.
 * No dependencies on other server modules — safe to import anywhere.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import type { RuntimeState, StatusPageInput } from "./server-types.js";

// ── HTML escaping ─────────────────────────────────────────────────────────────

export function escapeHtml(value: unknown): string {
  const text = value == null ? "" : String(value);
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ── Serialisation ─────────────────────────────────────────────────────────────

export function serialize(value: unknown): string {
  return JSON.stringify(value ?? null).replaceAll("<", "\\u003c");
}

// ── Request ID ────────────────────────────────────────────────────────────────

export function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Content negotiation ───────────────────────────────────────────────────────

export function prefersHtmlResponse(request: IncomingMessage): boolean {
  if ((request.url ?? "").startsWith("/api")) {
    return false;
  }
  const accept = request.headers.accept ?? "";
  if (accept.includes("application/json") && !accept.includes("text/html")) {
    return false;
  }
  return true;
}

// ── Response helpers ──────────────────────────────────────────────────────────

export function sendJson(response: ServerResponse, statusCode: number, value: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

export function sendText(response: ServerResponse, statusCode: number, message: string): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.end(message);
}

export function sendXml(response: ServerResponse, statusCode: number, xml: string): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/xml; charset=utf-8");
  response.end(xml);
}

export function createWeakEtag(value: string): string {
  const digest = createHash("sha1").update(value).digest("base64url");
  return `W/\"${digest}\"`;
}

const MAX_BODY_BYTES = 1_048_576; // 1 MB

export async function parseRequestBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      throw Object.assign(new Error("Request body too large (limit: 1 MB)."), { statusCode: 413 });
    }
    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return {};
  }

  const contentType = request.headers["content-type"] ?? "";

  if (contentType.includes("application/json")) {
    const parsed = JSON.parse(rawBody);
    // Reject prototype pollution attempts.
    if (parsed !== null && typeof parsed === "object") {
      const hasOwn = Object.prototype.hasOwnProperty;
      if (
        hasOwn.call(parsed, "__proto__") ||
        hasOwn.call(parsed, "constructor") ||
        hasOwn.call(parsed, "prototype")
      ) {
        throw Object.assign(new Error("Request body contains forbidden keys."), { statusCode: 400 });
      }
    }
    return parsed as Record<string, unknown>;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const entries = [...new URLSearchParams(rawBody).entries()].filter(
      ([key]) => key !== "__proto__" && key !== "constructor" && key !== "prototype",
    );
    return Object.fromEntries(entries);
  }

  return { raw: rawBody };
}

// ── Server event log ──────────────────────────────────────────────────────────

export function pushServerEvent(
  state: RuntimeState,
  level: "info" | "warn" | "error",
  event: string,
  details?: string,
): void {
  state.serverEvents.unshift({
    at: new Date().toISOString(),
    level,
    event,
    details,
  });
  if (state.serverEvents.length > 120) {
    state.serverEvents.length = 120;
  }
}
