import { Provider } from '@angular/core';
import { ProfileRepository } from './domain/profile.repository';
import { ProfileRepositoryImpl } from './infrastructure/profile-repository.impl';

export const PROFILE_PROVIDERS: Provider[] = [
  {
    provide: ProfileRepository,
    useClass: ProfileRepositoryImpl
  }
];
