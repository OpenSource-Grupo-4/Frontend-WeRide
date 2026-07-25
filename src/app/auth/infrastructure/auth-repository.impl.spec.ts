import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthRepositoryImpl } from './auth-repository.impl';
import { AuthCredentials } from '../domain/model/auth-credentials.entity';
import { RegistrationData } from '../domain/model/registration-data.entity';
import { AUTH_SESSION_KEY } from './token-storage';
import { environment } from '../../../environments/environment';

describe('AuthRepositoryImpl - login real', () => {
  let repository: AuthRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    TestBed.configureTestingModule({
      providers: [
        AuthRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    repository = TestBed.inject(AuthRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(AUTH_SESSION_KEY);
  });

  it('llama a POST /authentication/sign-in con username y password', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const fakeToken = `h.${btoa(JSON.stringify({ sub: 'nico', exp }))}.s`;

    repository.loginWithEmail(new AuthCredentials('nico', 'secret123')).subscribe(session => {
      expect(session.token).toBe(fakeToken);
      expect(session.user.id).toBe('7');
      expect(session.user.name).toBe('nico');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.authentication}/sign-in`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'nico', password: 'secret123' });
    req.flush({ id: 7, token: fakeToken });
  });

  it('guarda la sesión en localStorage tras el login', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const fakeToken = `h.${btoa(JSON.stringify({ sub: 'nico', exp }))}.s`;

    repository.loginWithEmail(new AuthCredentials('nico', 'secret123')).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.authentication}/sign-in`);
    req.flush({ id: 7, token: fakeToken });

    const stored = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)!);
    expect(stored.token).toBe(fakeToken);
  });

  it('preserva el profileId ya guardado en un segundo login (no lo borra)', () => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ profileId: 42 }));

    const exp = Math.floor(Date.now() / 1000) + 3600;
    const fakeToken = `h.${btoa(JSON.stringify({ sub: 'nico', exp }))}.s`;

    repository.loginWithEmail(new AuthCredentials('nico', 'secret123')).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.authentication}/sign-in`);
    req.flush({ id: 7, token: fakeToken });

    const stored = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)!);
    expect(stored.profileId).toBe(42);
    expect(stored.token).toBe(fakeToken);
  });

  it('traduce un 401 del backend a un mensaje de credenciales inválidas', () => {
    let receivedError: Error | undefined;

    repository.loginWithEmail(new AuthCredentials('nico', 'wrong')).subscribe({
      error: (err) => (receivedError = err)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.authentication}/sign-in`);
    req.flush('credenciales inválidas', { status: 401, statusText: 'Unauthorized' });

    expect(receivedError?.message).toBe('Usuario o contraseña incorrectos');
  });
});

describe('AuthRepositoryImpl - registro real', () => {
  let repository: AuthRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    TestBed.configureTestingModule({
      providers: [
        AuthRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    repository = TestBed.inject(AuthRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(AUTH_SESSION_KEY);
  });

  it('con password presente, llama a POST /authentication/sign-up', () => {
    const data = new RegistrationData('Nico', 'Ramos', '', 'nico', 'secret123');

    repository.register(data).subscribe(user => {
      expect(user.id).toBe('9');
      expect(user.name).toBe('nico');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.authentication}/sign-up`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'nico', password: 'secret123' });
    req.flush({ id: 9, username: 'nico' });
  });

  it('sin password (flujo de teléfono), NO llama al backend', () => {
    const data = new RegistrationData('Nico', 'Ramos', '51999999999');

    repository.register(data).subscribe(user => {
      expect(user.phone).toBe('51999999999');
    });

    httpMock.expectNone(`${environment.apiUrl}${environment.endpoints.authentication}/sign-up`);
  });
});

describe('AuthRepositoryImpl - loginWithGoogle', () => {
  let repository: AuthRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    TestBed.configureTestingModule({
      providers: [
        AuthRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    repository = TestBed.inject(AuthRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(AUTH_SESSION_KEY);
  });

  it('resuelve la sesión para un usuario mock de Google, sin llamar a /authentication/sign-in', () => {
    repository.loginWithGoogle({ email: 'usuario@gmail.com' }).subscribe(session => {
      expect(session.user.email).toBe('usuario@gmail.com');
      expect(session.user.name).toBe('Usuario Demo');
      expect(session.isValid).toBeTrue();
    });

    httpMock.expectNone(`${environment.apiUrl}${environment.endpoints.authentication}/sign-in`);
  });

  it('falla con "Usuario no encontrado" si el email no existe en hardcoded-users', () => {
    let receivedError: Error | undefined;

    repository.loginWithGoogle({ email: 'no-existe@gmail.com' }).subscribe({
      error: (err) => (receivedError = err)
    });

    expect(receivedError?.message).toBe('Usuario no encontrado');
    httpMock.expectNone(`${environment.apiUrl}${environment.endpoints.authentication}/sign-in`);
  });
});
