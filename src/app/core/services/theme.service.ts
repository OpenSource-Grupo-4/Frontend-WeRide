import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'weride-theme-preference';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _currentTheme = signal<Theme>(this.getInitialTheme());

  readonly currentTheme = this._currentTheme.asReadonly();

  constructor() {
    effect(() => {
      const theme = this._currentTheme();
      this.applyThemeToDocument(theme);
    });
  }

  toggleTheme(): void {
    const newTheme: Theme = this._currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    this._currentTheme.set(theme);
    this.persistTheme(theme);
  }

  private getInitialTheme(): Theme {
    const stored = this.getStoredTheme();
    return stored ?? 'light';
  }

  private getStoredTheme(): Theme | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return null;
  }

  private persistTheme(theme: Theme): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }

  private applyThemeToDocument(theme: Theme): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(`${theme}-theme`);
    }
  }
}
