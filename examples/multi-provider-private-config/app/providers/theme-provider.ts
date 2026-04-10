/**
 * Theme Provider
 * 
 * @intent Global theme context - manages light/dark mode
 * @target global
 * @priority 1
 */

export interface ThemeProviderProps {
  children: string;
  route?: string;
}

export default function ThemeProvider({ children, route }: ThemeProviderProps): string {
  return `
    <div data-theme-wrapper="true">
      ${children}
    </div>
    <script>
      (function() {
        // Initialize theme before paint to prevent flash
        function getTheme() {
          try {
            const saved = localStorage.getItem('fiyuu-theme');
            if (saved) return saved;
          } catch(e) {}
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        const theme = getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
      })();
    </script>
    <style>
      :root {
        --bg-primary: #ffffff;
        --bg-secondary: #f5f5f5;
        --text-primary: #111111;
        --text-secondary: #666666;
        --accent: #3a624b;
      }
      
      [data-theme="dark"] {
        --bg-primary: #0a0a0a;
        --bg-secondary: #1a1a1a;
        --text-primary: #ffffff;
        --text-secondary: #a0a0a0;
        --accent: #5a826b;
      }
      
      [data-theme-wrapper] {
        background: var(--bg-primary);
        color: var(--text-primary);
        min-height: 100vh;
      }
    </style>
  `;
}

// Theme toggle helper
export function themeToggleScript(): string {
  return `
    <script>
      window.fiyuu = window.fiyuu || {};
      window.fiyuu.theme = {
        get() {
          return document.documentElement.getAttribute('data-theme') || 'light';
        },
        set(value) {
          document.documentElement.setAttribute('data-theme', value);
          document.documentElement.classList.toggle('dark', value === 'dark');
          try {
            localStorage.setItem('fiyuu-theme', value);
          } catch(e) {}
        },
        toggle() {
          const next = this.get() === 'dark' ? 'light' : 'dark';
          this.set(next);
        }
      };
    </script>
  `;
}
