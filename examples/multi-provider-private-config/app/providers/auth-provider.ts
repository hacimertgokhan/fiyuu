/**
 * Auth Provider
 * 
 * @intent Authentication context - manages user session
 * @target layout
 * @priority 10
 */

import { readPrivateJson } from "@fiyuu/core";

export interface AuthProviderProps {
  children: string;
  route?: string;
}

export default async function AuthProvider({ children, route }: AuthProviderProps): Promise<string> {
  // Read auth config from private directory (server-side only)
  const authConfig = await readPrivateJson<{ requireAuth: string[] }>("config/auth-config.json");
  
  const isProtectedRoute = authConfig?.requireAuth.some((pattern) => 
    route?.startsWith(pattern)
  );

  return `
    <div data-auth-provider="true" data-protected="${isProtectedRoute}">
      ${children}
    </div>
    ${isProtectedRoute ? authGuardScript() : ""}
  `;
}

function authGuardScript(): string {
  return `
    <script>
      (function() {
        // Check auth status on client
        const token = document.cookie.match(/auth-token=([^;]+)/);
        const isAuthenticated = !!token;
        
        if (!isAuthenticated && document.querySelector('[data-auth-provider][data-protected="true"]')) {
          // Redirect to login
          window.location.href = '/auth/login?redirect=' + encodeURIComponent(location.pathname);
        }
      })();
    </script>
  `;
}
