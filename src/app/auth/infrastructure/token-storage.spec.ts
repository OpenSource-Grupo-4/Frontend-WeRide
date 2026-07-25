import { AUTH_SESSION_KEY, getStoredToken, decodeJwtExpiry } from './token-storage';

describe('token-storage', () => {
  afterEach(() => localStorage.removeItem(AUTH_SESSION_KEY));

  it('getStoredToken devuelve null si no hay sesión guardada', () => {
    expect(getStoredToken()).toBeNull();
  });

  it('getStoredToken devuelve el token de la sesión guardada', () => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token: 'abc123' }));
    expect(getStoredToken()).toBe('abc123');
  });

  it('getStoredToken devuelve null si el JSON guardado está corrupto', () => {
    localStorage.setItem(AUTH_SESSION_KEY, '{not-json');
    expect(getStoredToken()).toBeNull();
  });

  it('decodeJwtExpiry lee el claim exp del JWT', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ sub: 'user', exp }));
    const token = `header.${payload}.signature`;
    expect(decodeJwtExpiry(token).getTime()).toBe(exp * 1000);
  });

  it('decodeJwtExpiry cae a un fallback de 24h si el token es inválido', () => {
    const before = Date.now();
    const result = decodeJwtExpiry('token-invalido');
    const diffHours = (result.getTime() - before) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(23);
    expect(diffHours).toBeLessThan(25);
  });
});
