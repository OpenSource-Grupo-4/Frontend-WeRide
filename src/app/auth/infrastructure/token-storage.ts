export const AUTH_SESSION_KEY = 'auth_session';

interface StoredAuthSession {
  token: string;
  profileId?: number | null;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    const data: StoredAuthSession = JSON.parse(raw);
    return data.token ?? null;
  } catch {
    return null;
  }
}

export function decodeJwtExpiry(token: string): Date {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (typeof payload.exp === 'number') {
      return new Date(payload.exp * 1000);
    }
  } catch {
    // ponytail: token malformado o sin claim exp — cae al fallback de 24h.
    // El backend igual valida el token real en cada request; esto solo
    // afecta cuándo el frontend decide refrescar/cerrar sesión localmente.
  }
  const fallback = new Date();
  fallback.setHours(fallback.getHours() + 24);
  return fallback;
}

export function getStoredProfileId(): number | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    const data: StoredAuthSession = JSON.parse(raw);
    return data.profileId ?? null;
  } catch {
    return null;
  }
}

export function setStoredProfileId(profileId: number): void {
  if (typeof window === 'undefined') return;

  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    data.profileId = profileId;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data));
  } catch {
    // ponytail: sesión corrupta — no hay nada válido donde adjuntar el profileId.
  }
}
