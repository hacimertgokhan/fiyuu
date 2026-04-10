/**
 * Error Boundary Provider
 * 
 * @intent Global error boundary - catches and handles render errors gracefully
 * @target global
 * @priority 0
 */

export interface ErrorBoundaryProps {
  children: string;
  route?: string;
}

export default function ErrorBoundary({ children, route }: ErrorBoundaryProps): string {
  const boundaryId = `error-boundary-global-${Math.random().toString(36).slice(2, 8)}`;
  
  return `
    <div data-error-boundary="${boundaryId}" data-route="${route || '/'}">
      <div data-error-boundary-content="${boundaryId}">
        ${children}
      </div>
      <div data-error-boundary-fallback="${boundaryId}" style="display:none;">
        <div class="error-fallback">
          <h3>⚠️ Something went wrong</h3>
          <p>We're sorry, but something unexpected happened.</p>
          <button onclick="this.closest('[data-error-boundary]').dispatchEvent(new CustomEvent('fiyuu:retry'))">
            Try Again
          </button>
        </div>
      </div>
    </div>
    <script>
      (function() {
        const boundary = document.querySelector('[data-error-boundary="${boundaryId}"]');
        const content = document.querySelector('[data-error-boundary-content="${boundaryId}"]');
        const fallback = document.querySelector('[data-error-boundary-fallback="${boundaryId}"]');
        
        if (!boundary || !content || !fallback) return;
        
        boundary.addEventListener('fiyuu:error', function(e) {
          console.error('[Fiyuu Error]', e.detail);
          content.style.display = 'none';
          fallback.style.display = 'block';
        });
        
        boundary.addEventListener('fiyuu:retry', function() {
          content.style.display = 'block';
          fallback.style.display = 'none';
          window.location.reload();
        });
        
        boundary.addEventListener('error', function(e) {
          e.preventDefault();
          boundary.dispatchEvent(new CustomEvent('fiyuu:error', { 
            detail: { message: e.message, source: 'runtime' }
          }));
        }, true);
      })();
    </script>
    <style>
      .error-fallback {
        padding: 40px 24px;
        text-align: center;
        background: var(--bg-secondary);
        border-radius: 12px;
        margin: 20px;
      }
      .error-fallback h3 {
        margin: 0 0 12px 0;
        color: #7f3e3e;
        font-size: 20px;
      }
      .error-fallback p {
        margin: 0 0 20px 0;
        color: var(--text-secondary);
      }
      .error-fallback button {
        padding: 10px 20px;
        background: var(--accent);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      .error-fallback button:hover {
        opacity: 0.9;
      }
    </style>
  `;
}
