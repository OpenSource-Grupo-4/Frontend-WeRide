import { Provider } from '@angular/core';
import { AuthRepository } from './domain/auth.repository';
import { AuthRepositoryImpl } from './infrastructure/auth-repository.impl';

export const AUTH_PROVIDERS: Provider[] = [
  {
    provide: AuthRepository,
    useClass: AuthRepositoryImpl
  }
];

