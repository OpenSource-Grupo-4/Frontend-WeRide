import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../application/auth.store';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const session = authStore.session();
  const isAuthenticated = session && session.isValid && !session.isGuest;

  if (!isAuthenticated) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};

