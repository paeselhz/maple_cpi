/** Reactive theme state (light/dark) + a revision counter charts watch to re-theme. */
class ThemeState {
  current = $state<'light' | 'dark'>('light');
  revision = $state(0);

  init() {
    if (typeof document === 'undefined') return;
    const attr = document.documentElement.dataset.theme as 'light' | 'dark' | undefined;
    this.current = attr ?? 'light';
  }

  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = this.current;
    try {
      localStorage.setItem('theme', this.current);
    } catch {
      /* ignore */
    }
    this.revision++;
  }
}

export const theme = new ThemeState();
