/**
 * Theme Provider
 * 
 * @intent Global theme context - manages light/dark mode for fiyuu website
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
        --bg-primary: #fafafa;
        --bg-secondary: #f0f0f0;
        --text-primary: #09090b;
        --text-secondary: #52525b;
        --accent: #3a624b;
        --accent-soft: rgba(58, 98, 75, 0.15);
        --border: #e4e4e7;
        --border-subtle: rgba(0, 0, 0, 0.08);
      }
      
      [data-theme="dark"] {
        --bg-primary: #09090b;
        --bg-secondary: #18181b;
        --text-primary: #fafafa;
        --text-secondary: #a1a1aa;
        --accent: #5a826b;
        --accent-soft: rgba(90, 130, 107, 0.15);
        --border: #27272a;
        --border-subtle: rgba(255, 255, 255, 0.08);
      }
      
      [data-theme-wrapper] {
        background: var(--bg-primary);
        color: var(--text-primary);
        min-height: 100vh;
      }
    </style>
  `;
}

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
