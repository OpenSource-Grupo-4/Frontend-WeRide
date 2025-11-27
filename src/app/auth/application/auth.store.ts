import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { User } from '../domain/model/user.entity';
import { AuthSession } from '../domain/model/auth-session.entity';
import { LoginWithEmailUseCase } from './login-with-email.use-case';
import { LoginWithPhoneUseCase } from './login-with-phone.use-case';
import { LoginAsGuestUseCase } from './login-as-guest.use-case';
import { RegisterUserUseCase } from './register-user.use-case';
import { SendVerificationCodeUseCase } from './send-verification-code.use-case';
import { LogoutUseCase } from './logout.use-case';
import { AuthCredentials } from '../domain/model/auth-credentials.entity';
import { PhoneCredentials } from '../domain/model/phone-credentials.entity';
import { RegistrationData } from '../domain/model/registration-data.entity';

interface AuthState {
  currentUser: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  verificationCodeSent: boolean;
  registrationStep: 'phone' | 'verification' | 'details' | 'completed';
}

const initialState: AuthState = {
  currentUser: null,
  session: null,
  isLoading: false,
  error: null,
  verificationCodeSent: false,
  registrationStep: 'phone'
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const loginWithEmailUseCase = inject(LoginWithEmailUseCase);
    const loginWithPhoneUseCase = inject(LoginWithPhoneUseCase);
    const loginAsGuestUseCase = inject(LoginAsGuestUseCase);
    const registerUserUseCase = inject(RegisterUserUseCase);
    const sendVerificationCodeUseCase = inject(SendVerificationCodeUseCase);
    const logoutUseCase = inject(LogoutUseCase);

    return {
      loginWithEmail: rxMethod<AuthCredentials>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((credentials) =>
            loginWithEmailUseCase.execute(credentials).pipe(
              tap((session) => {
                patchState(store, {
                  session,
                  currentUser: session.user,
                  isLoading: false,
                  error: null
                });
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Error al iniciar sesión'
                });
                return of(null);
              })
            )
          )
        )
      ),

      loginWithGoogle: rxMethod<any>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((googleAccount) =>
            loginWithEmailUseCase.execute({
              email: googleAccount.email,
              password: '1234'
            }).pipe(
              tap((session) => {
                patchState(store, {
                  session,
                  currentUser: session.user,
                  isLoading: false,
                  error: null
                });
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Error al iniciar sesión con Google'
                });
                return of(null);
              })
            )
          )
        )
      ),

      loginWithPhone: rxMethod<PhoneCredentials>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((credentials) =>
            loginWithPhoneUseCase.execute(credentials).pipe(
              tap((session) => {
                patchState(store, {
                  session,
                  currentUser: session.user,
                  isLoading: false,
                  error: null
                });
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Otp Invalido'
                });
                return of(null);
              })
            )
          )
        )
      ),

      loginAsGuest: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() =>
            loginAsGuestUseCase.execute().pipe(
              tap((session) => {
                patchState(store, {
                  session,
                  currentUser: session.user,
                  isLoading: false,
                  error: null
                });
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Error al entrar como invitado'
                });
                return of(null);
              })
            )
          )
        )
      ),

      sendVerificationCode: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null, verificationCodeSent: false })),
          switchMap((phone) =>
            sendVerificationCodeUseCase.execute(phone).pipe(
              tap((sent) => {
                patchState(store, {
                  isLoading: false,
                  verificationCodeSent: sent,
                  registrationStep: 'verification'
                });
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Error al enviar código'
                });
                return of(null);
              })
            )
          )
        )
      ),

      registerUser: rxMethod<RegistrationData>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            registerUserUseCase.execute(data).pipe(
              tap((user) => {
                patchState(store, {
                  currentUser: user,
                  isLoading: false,
                  error: null,
                  registrationStep: 'completed'
                });
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Error al registrar usuario'
                });
                return of(null);
              })
            )
          )
        )
      ),

      logout: rxMethod<void>(
        pipe(
          switchMap(() =>
            logoutUseCase.execute().pipe(
              tap(() => {
                patchState(store, initialState);
              }),
              catchError(() => {
                patchState(store, initialState);
                return of(null);
              })
            )
          )
        )
      ),

      clearError: () => {
        patchState(store, { error: null });
      },

      setRegistrationStep: (step: 'phone' | 'verification' | 'details' | 'completed') => {
        patchState(store, { registrationStep: step });
      },

      setSession(session: any) {
        patchState(store, { session, currentUser: session.user });

        if (typeof window !== 'undefined') {
          localStorage.setItem('session', JSON.stringify(session));
        }
      }
    };
  })
);
