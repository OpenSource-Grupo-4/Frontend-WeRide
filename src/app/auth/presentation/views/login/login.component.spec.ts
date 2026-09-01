import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { AuthStore } from '../../../application/auth.store';
import { LoginComponent } from './login.component';
import { AuthSession } from '../../../domain/model/auth-session.entity';
import { User } from '../../../domain/model/user.entity';

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

function makeUser(): User {
  return new User(
    'guest', 'Invitado', 'guest@weride.com', '', 'free-plan', true,
    '', '', '', '', 'guest', new Date().toISOString(),
    { language: 'es', notifications: false, theme: 'light' },
    { totalTrips: 0, totalDistance: 0, totalSpent: 0, averageRating: 0 }
  );
}

function makeSession(isGuest: boolean): AuthSession {
  return new AuthSession(makeUser(), 'token-guest', new Date(Date.now() + 3600_000), isGuest);
}

describe('LoginComponent (flujo guest)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let routerSpy: jasmine.SpyObj<Router>;
  let authStore: { loginAsGuest: jasmine.Spy };
  let storeSession: { value: AuthSession | null };
  let storeError: { value: string | null };
  let storeLoading: { value: boolean };

  beforeEach(() => {
    storeSession = { value: null };
    storeError = { value: null };
    storeLoading = { value: false };
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authStore = {
      loginAsGuest: jasmine.createSpy('loginAsGuest').and.callFake(() => {
        // El store real setea session/error sincrónicamente a través de rxMethod;
        // aquí simulamos ese comportamiento para ejercitar el effect.
        storeSession.value = makeSession(true);
        storeError.value = null;
        storeLoading.value = false;
      })
    };

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader }
        })
      ],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: AuthStore, useValue: {
          session: () => storeSession.value,
          error: () => storeError.value,
          isLoading: () => storeLoading.value,
          loginAsGuest: authStore.loginAsGuest,
          loginWithEmail: jasmine.createSpy('loginWithEmail'),
          loginWithGoogle: jasmine.createSpy('loginWithGoogle'),
          loginWithPhone: jasmine.createSpy('loginWithPhone'),
          sendVerificationCode: jasmine.createSpy('sendVerificationCode'),
          registerUser: jasmine.createSpy('registerUser'),
          logout: jasmine.createSpy('logout'),
          clearError: jasmine.createSpy('clearError'),
          setRegistrationStep: jasmine.createSpy('setRegistrationStep'),
          setSession: jasmine.createSpy('setSession')
        } }
      ]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('navega a /home cuando el login guest crea una sesión válida', () => {
    component.loginAsGuest();
    fixture.detectChanges();

    expect(authStore.loginAsGuest).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.guestError()).toBe('');
  });

  it('permite iniciar sesión como invitado aunque la carga inicial no haya terminado', () => {
    component.dataLoaded = false;
    fixture.detectChanges();

    const guestButton = fixture.nativeElement.querySelector('.btn-guest');
    expect(guestButton.disabled).toBeFalse();

    component.loginAsGuest();
    fixture.detectChanges();

    expect(authStore.loginAsGuest).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('muestra un mensaje de error cuando el login guest falla', () => {
    authStore.loginAsGuest.and.callFake(() => {
      storeError.value = 'Error al entrar como invitado';
      storeLoading.value = false;
    });

    component.loginAsGuest();
    fixture.detectChanges();

    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(component.guestError()).toBe('Error al entrar como invitado');

    const errorEl = fixture.nativeElement.querySelector('.guest-error');
    expect(errorEl).not.toBeNull();
    expect(errorEl.textContent.trim()).toContain('Error al entrar como invitado');
  });
});
