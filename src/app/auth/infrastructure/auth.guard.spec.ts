import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '../application/auth.store';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('rechaza sesiones invitadas porque no tienen un JWT real', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: {
            session: () => ({ isValid: true, isGuest: true, isAuthenticated: false })
          }
        },
        { provide: Router, useValue: router }
      ]
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('permite sesiones autenticadas con JWT válido', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: {
            session: () => ({ isValid: true, isGuest: false, isAuthenticated: true })
          }
        },
        { provide: Router, useValue: router }
      ]
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
