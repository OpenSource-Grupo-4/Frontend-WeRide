import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { Profile } from '../domain/model/profile.entity';
import { CreateProfileData } from '../domain/profile.repository';
import { CreateProfileUseCase } from './create-profile.use-case';
import { GetProfileUseCase } from './get-profile.use-case';
import { setStoredProfileId } from '../../auth/infrastructure/token-storage';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null
};

export const ProfileStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const createProfileUseCase = inject(CreateProfileUseCase);
    const getProfileUseCase = inject(GetProfileUseCase);

    return {
      createProfile: rxMethod<CreateProfileData>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            createProfileUseCase.execute(data).pipe(
              tap((profile) => {
                setStoredProfileId(profile.id);
                patchState(store, { profile, isLoading: false, error: null });
              }),
              catchError((error) => {
                patchState(store, { isLoading: false, error: error.message || 'Error al crear el perfil' });
                return of(null);
              })
            )
          )
        )
      ),

      getProfile: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((profileId) =>
            getProfileUseCase.execute(profileId).pipe(
              tap((profile) => {
                patchState(store, { profile, isLoading: false, error: null });
              }),
              catchError((error) => {
                patchState(store, { isLoading: false, error: error.message || 'Error al cargar el perfil' });
                return of(null);
              })
            )
          )
        )
      )
    };
  })
);
