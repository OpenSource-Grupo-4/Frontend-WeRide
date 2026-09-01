import { AuthSession } from './auth-session.entity';
import { User } from './user.entity';

function makeUser(): User {
  return new User(
    '1', 'Test', 'test@weride.com', '', '', true, '', '', '', '', 'verified',
    new Date().toISOString(),
    { language: 'es', notifications: true, theme: 'light' },
    { totalTrips: 0, totalDistance: 0, totalSpent: 0, averageRating: 0 }
  );
}

describe('AuthSession', () => {
  const future = () => new Date(Date.now() + 60_000);

  it('considera autenticada una sesión no invitada con JWT', () => {
    const session = new AuthSession(makeUser(), 'header.payload.signature', future(), false);
    expect(session.isAuthenticated).toBeTrue();
  });

  it('no considera autenticada una sesión con token local simulado', () => {
    const session = new AuthSession(makeUser(), 'token_local', future(), false);
    expect(session.isAuthenticated).toBeFalse();
  });
});
