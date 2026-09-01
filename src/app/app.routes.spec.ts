import { authGuard, sessionGuard } from './auth/infrastructure/auth.guard';
import { routes } from './app.routes';

describe('app routes authentication boundaries', () => {
  const shellRoute = routes.find(route => route.path === '' && route.children);

  it('permite que una sesión invitada llegue al shell y al home', () => {
    expect(shellRoute?.canActivate).toContain(sessionGuard);

    const homeRoute = shellRoute?.children?.find(route => route.path === 'home');
    expect(homeRoute?.canActivate).toBeUndefined();
  });

  ['vehicle-status', 'schedule-unlock', 'trip', 'booking', 'plan', 'garage', 'user'].forEach(path => {
    it(`protege /${path} con autenticación JWT real`, () => {
      const protectedRoute = shellRoute?.children?.find(route => route.path === path);
      expect(protectedRoute?.canActivate).toContain(authGuard);
    });
  });
});
