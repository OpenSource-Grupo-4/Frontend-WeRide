import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { ThemeService, Theme } from './theme.service';

describe('ThemeService', () => {
  const THEME_STORAGE_KEY = 'weride-theme-preference';

  beforeEach(() => {
    localStorage.clear();
  });

  function createService(): ThemeService {
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    return TestBed.inject(ThemeService);
  }

  /**
   * **Feature: home-improvement, Property 4: Theme selection updates current theme signal**
   * **Validates: Requirements 3.1**
   * 
   * For any theme value ('light' or 'dark'), calling setTheme SHALL immediately 
   * update the currentTheme signal to that value.
   */
  describe('Property 4: Theme selection updates current theme signal', () => {
    it('should update currentTheme signal immediately when setTheme is called', () => {
      const themeArbitrary = fc.constantFrom<Theme>('light', 'dark');

      fc.assert(
        fc.property(themeArbitrary, (theme) => {
          TestBed.resetTestingModule();
          localStorage.clear();
          const service = createService();
          
          service.setTheme(theme);
          
          return service.currentTheme() === theme;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: home-improvement, Property 5: Theme persistence round-trip**
   * **Validates: Requirements 3.2**
   * 
   * For any theme preference, setting the theme and then reading from localStorage 
   * SHALL return the same theme value.
   */
  describe('Property 5: Theme persistence round-trip', () => {
    it('should persist theme to localStorage and retrieve the same value', () => {
      const themeArbitrary = fc.constantFrom<Theme>('light', 'dark');

      fc.assert(
        fc.property(themeArbitrary, (theme) => {
          TestBed.resetTestingModule();
          localStorage.clear();
          const service = createService();
          
          service.setTheme(theme);
          const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
          
          return storedTheme === theme;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: home-improvement, Property 6: Theme restoration on initialization**
   * **Validates: Requirements 3.3**
   * 
   * For any theme value stored in localStorage, initializing the ThemeService 
   * SHALL restore the currentTheme signal to that stored value.
   */
  describe('Property 6: Theme restoration on initialization', () => {
    it('should restore theme from localStorage on service initialization', () => {
      const themeArbitrary = fc.constantFrom<Theme>('light', 'dark');

      fc.assert(
        fc.property(themeArbitrary, (theme) => {
          TestBed.resetTestingModule();
          localStorage.clear();
          localStorage.setItem(THEME_STORAGE_KEY, theme);
          
          const service = createService();
          
          return service.currentTheme() === theme;
        }),
        { numRuns: 100 }
      );
    });
  });
});
