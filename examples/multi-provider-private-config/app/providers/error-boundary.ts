/**
 * Error Boundary Provider
 * 
 * @intent Global error boundary - catches and handles render errors
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
        <!-- Error fallback will be injected here -->
      </div>
    </div>
    <script>
      (function() {
        const boundary = document.querySelector('[data-error-boundary="${boundaryId}"]');
        const content = document.querySelector('[data-error-boundary-content="${boundaryId}"]');
        const fallback = document.querySelector('[data-error-boundary-fallback="${boundaryId}"]');
        
        if (!boundary || !content || !fallback) return;
        
        // Handle errors within this boundary
        boundary.addEventListener('fiyuu:error', function(e) {
          console.error('[Fiyuu Error Boundary]', e.detail);
          
          const error = e.detail;
          content.style.display = 'none';
          fallback.style.display = 'block';
          
          fallback.innerHTML = \`
            <div style="
              padding: 24px;
              background: #f2dfd5;
              border: 1px solid #7f3e3e33;
              border-radius: 12px;
              font-family: system-ui, sans-serif;
              margin: 16px;
            ">
              <h3 style="color: #7f3e3e; margin: 0 0 12px 0; font-size: 16px;">
                ⚠️ Something went wrong
              </h3>
              <p style="color: #18211d; margin: 0 0 16px 0; font-size: 14px;">
                \${error.message || 'An unexpected error occurred'}
              </p>
              <button 
                onclick="this.closest('[data-error-boundary]').dispatchEvent(new CustomEvent('fiyuu:retry'))"
                style="
                  padding: 8px 16px;
                  background: #7f3e3e;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                "
              >
                Try Again
              </button>
            </div>
          \`;
        });
        
        // Handle retry
        boundary.addEventListener('fiyuu:retry', function() {
          content.style.display = 'block';
          fallback.style.display = 'none';
          fallback.innerHTML = '';
        });
        
        // Catch runtime errors in child elements
        boundary.addEventListener('error', function(e) {
          e.preventDefault();
          boundary.dispatchEvent(new CustomEvent('fiyuu:error', { 
            detail: { message: e.message, source: 'runtime' }
          }));
        }, true);
      })();
    </script>
  `;
}
