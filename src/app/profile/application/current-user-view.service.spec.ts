import { toCurrentUserView } from './current-user-view.service';
import { User as AuthUser } from '../../auth/domain/model/user.entity';
import { Profile } from '../domain/model/profile.entity';

describe('toCurrentUserView', () => {
  const authUser = new AuthUser(
    '7', 'nico', 'nico@weride.com', '', '', true, '', '', '', '', 'pending',
    '2026-07-25T00:00:00.000Z',
    { language: 'es', notifications: true, theme: 'light' },
    { totalTrips: 0, totalDistance: 0, totalSpent: 0, averageRating: 0 }
  );

  it('devuelve null si no hay usuario autenticado', () => {
    expect(toCurrentUserView(null, null)).toBeNull();
  });

  it('usa el nombre/email del auth user si el profile aun no cargo', () => {
    const result = toCurrentUserView(authUser, null);
    expect(result?.name).toBe('nico');
    expect(result?.email).toBe('nico@weride.com');
    expect(result?.id).toBe(7);
  });

  it('usa firstName+lastName y email del profile real cuando esta disponible', () => {
    const profile = new Profile(3, 7, 'Nico', 'Ramos', 'nico.real@weride.com');
    const result = toCurrentUserView(authUser, profile);
    expect(result?.name).toBe('Nico Ramos');
    expect(result?.email).toBe('nico.real@weride.com');
  });
});
