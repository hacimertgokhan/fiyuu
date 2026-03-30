/**
 * Global middleware — runs on every request.
 * Protects /dashboard from unauthenticated users.
 */

import { defineMiddleware } from "@fiyuu/core";
import { getSessionUser } from "../lib/auth.js";

export const middleware = defineMiddleware(async ({ url, request }, next) => {
  const { pathname } = url;

  // ── Protect /dashboard ────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const user = await getSessionUser(request);
    if (!user) {
      return {
        headers: { Location: `/auth?next=${encodeURIComponent(pathname)}` },
        response: { status: 302, body: "" },
      };
    }
    // Require admin role for dashboard.
    if (user.role !== "admin") {
      return {
        headers: { Location: "/" },
        response: { status: 302, body: "" },
      };
    }
  }

  // ── Redirect /auth if already logged in ───────────────────────────────────
  if (pathname === "/auth") {
    const user = await getSessionUser(request);
    if (user) {
      return {
        headers: { Location: "/" },
        response: { status: 302, body: "" },
      };
    }
  }

  await next();
});
