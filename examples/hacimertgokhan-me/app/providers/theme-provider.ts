/**
 * Theme Provider
 * 
 * @intent Handles dark/light mode switching
 * @target global
 * @priority 10
 */

export interface ThemeProviderProps {
  children: string;
  defaultTheme?: "dark" | "light";
}

export default function ThemeProvider({ children, defaultTheme = "dark" }: ThemeProviderProps): string {
  return `
    <div data-theme-provider="true" data-default="${defaultTheme}">
      ${children}
    </div>
    <script>
      (function() {
        const defaultTheme = "${defaultTheme}";
        const stored = localStorage.getItem('theme');
        const theme = stored || defaultTheme;
        document.documentElement.classList.add(theme);
        
        window.toggleTheme = function() {
          const html = document.documentElement;
          const isDark = html.classList.contains('dark');
          html.classList.remove('dark', 'light');
          html.classList.add(isDark ? 'light' : 'dark');
          localStorage.setItem('theme', isDark ? 'light' : 'dark');
        };
      })();
    </script>
  `;
}
