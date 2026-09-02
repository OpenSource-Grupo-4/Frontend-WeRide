import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { VerificationComponent } from './verification.component';
import { AuthStore } from '../../../application/auth.store';
import { PhoneCredentials } from '../../../domain/model/phone-credentials.entity';

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({
      errors: { invalidCode: 'Código incorrecto' },
      auth: {
        verification: { errorTitle: 'Error', title: 'Verificación', subtitle: 'Ingresa el código' },
        login: { termsLine: 'Términos y condiciones' }
      },
      common: { next: 'Siguiente', back: 'Volver' }
    });
  }
}

describe('VerificationComponent', () => {
  let fixture: ComponentFixture<VerificationComponent>;
  let component: VerificationComponent;
  let routerSpy: jasmine.SpyObj<Router>;
  let storeSession: ReturnType<typeof signal<any>>;
  let storeError: ReturnType<typeof signal<string | null>>;
  let storeLoading: ReturnType<typeof signal<boolean>>;
  let storeCode: ReturnType<typeof signal<string | null>>;
  let loginWithPhoneSpy: jasmine.Spy;

  beforeEach(async () => {
    storeSession = signal<any>(null);
    storeError = signal<string | null>(null);
    storeLoading = signal(false);
    storeCode = signal<string | null>('1234');
    loginWithPhoneSpy = jasmine.createSpy('loginWithPhone');

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'getCurrentNavigation']);
    routerSpy.getCurrentNavigation.and.returnValue({
      extras: { state: { phone: '+51999999999', code: '1234' } }
    } as any);

    await TestBed.configureTestingModule({
      imports: [
        VerificationComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader }
        })
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthStore, useValue: {
          session: storeSession,
          error: storeError,
          isLoading: storeLoading,
          verificationCode: storeCode,
          loginWithPhone: loginWithPhoneSpy
        } }
      ]
    }).compileComponents();

    // The app loads translations asynchronously via translate.use(); the
    // FakeLoader is synchronous, so subscribing makes translations available
    // for translate.instant() right away.
    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('es');
    translate.use('es').subscribe();

    fixture = TestBed.createComponent(VerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('llama a authStore.loginWithPhone con las credenciales del teléfono', () => {
    component.code.set(['1', '2', '3', '4']);

    component.login();

    expect(loginWithPhoneSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ phone: '+51999999999', verificationCode: '1234' })
    );
  });

  it('muestra el mensaje de error visible cuando el store rechaza el código', () => {
    component.code.set(['1', '2', '3', '4']);
    component.login();
    expect(loginWithPhoneSpy).toHaveBeenCalled();

    storeError.set('Otp Invalido');
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Código incorrecto');

    const errorEl = fixture.nativeElement.querySelector('.error-toast');
    expect(errorEl).not.toBeNull();
    expect(errorEl.textContent).toContain('Otp Invalido');
  });

  it('navega a /home cuando el login con teléfono crea una sesión válida', () => {
    component.code.set(['1', '2', '3', '4']);
    component.login();

    storeSession.set({ isValid: true });
    fixture.detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('no navega cuando el código local no coincide y muestra el error', () => {
    component.code.set(['9', '9', '9', '9']);

    component.checkCode();

    expect(loginWithPhoneSpy).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Código incorrecto');
    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/home']);

    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('.error-toast');
    expect(errorEl).not.toBeNull();
    expect(errorEl.textContent).toContain('Código incorrecto');
  });
});
