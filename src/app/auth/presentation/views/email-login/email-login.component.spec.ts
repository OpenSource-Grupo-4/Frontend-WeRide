import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EmailLoginComponent } from './email-login.component';
import { AuthStore } from '../../../application/auth.store';
import { AuthCredentials } from '../../../domain/model/auth-credentials.entity';
import { RegistrationData } from '../../../domain/model/registration-data.entity';
import { User } from '../../../domain/model/user.entity';

describe('EmailLoginComponent', () => {
  let component: EmailLoginComponent;
  let fixture: ComponentFixture<EmailLoginComponent>;
  let authStoreSpy: jasmine.SpyObj<Pick<InstanceType<typeof AuthStore>, 'loginWithEmail' | 'registerUser'>> & {
    session: ReturnType<typeof signal<any>>;
    currentUser: ReturnType<typeof signal<any>>;
    error: ReturnType<typeof signal<any>>;
    isLoading: ReturnType<typeof signal<boolean>>;
  };

  beforeEach(async () => {
    authStoreSpy = jasmine.createSpyObj('AuthStore', ['loginWithEmail', 'registerUser']) as any;
    authStoreSpy.session = signal<any>(null);
    authStoreSpy.currentUser = signal<any>(null);
    authStoreSpy.error = signal<any>(null);
    authStoreSpy.isLoading = signal(false);

    await TestBed.configureTestingModule({
      imports: [EmailLoginComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: AuthStore, useValue: authStoreSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmailLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('en modo login, llama a authStore.loginWithEmail con las credenciales del formulario', () => {
    component.email.set('nico@weride.com');
    component.password.set('secret123');

    component.continue();

    expect(authStoreSpy.loginWithEmail).toHaveBeenCalledWith(
      new AuthCredentials('nico@weride.com', 'secret123')
    );
  });

  it('en modo registro, llama a authStore.registerUser con el password del formulario', () => {
    component.isRegisterMode.set(true);
    component.email.set('nico@weride.com');
    component.password.set('secret123');
    component.firstName.set('Nico');
    component.lastName.set('Ramos');

    component.continue();

    expect(authStoreSpy.registerUser).toHaveBeenCalledWith(
      new RegistrationData('Nico', 'Ramos', '', 'nico@weride.com', 'secret123')
    );
  });

  it('tras un registro exitoso dispara un unico auto-login y el guard justRegistered evita repetirlo', () => {
    component.isRegisterMode.set(true);
    component.email.set('nico@weride.com');
    component.password.set('secret123');
    component.firstName.set('Nico');
    component.lastName.set('Ramos');

    // Dispara continue() para marcar actionAttempted (privado) via la API publica.
    component.continue();
    expect(authStoreSpy.registerUser).toHaveBeenCalledTimes(1);

    // Simula el estado que deja un registro exitoso: usuario creado, sin sesion ni error.
    authStoreSpy.currentUser.set(new User(
      '1', 'Nico Ramos', 'nico@weride.com', '', 'basic', true, '', '', '', '', 'verified', '', {
        language: 'es', notifications: true, theme: 'light'
      }, { totalTrips: 0, totalDistance: 0, totalSpent: 0, averageRating: 0 }
    ));
    fixture.detectChanges();

    expect(authStoreSpy.loginWithEmail).toHaveBeenCalledTimes(1);

    // Segunda corrida del effect con el mismo estado (isLoading pasa por true y vuelve a false)
    // no debe volver a disparar loginWithEmail gracias al flag justRegistered.
    authStoreSpy.isLoading.set(true);
    fixture.detectChanges();
    authStoreSpy.isLoading.set(false);
    fixture.detectChanges();

    expect(authStoreSpy.loginWithEmail).toHaveBeenCalledTimes(1);
  });
});
