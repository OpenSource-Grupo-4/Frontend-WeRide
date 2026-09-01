import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '../application/auth.store';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('permite sesiones invitadas válidas', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { session: () => ({ isValid: true, isGuest: true }) } },
        { provide: Router, useValue: router }
      ]
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
