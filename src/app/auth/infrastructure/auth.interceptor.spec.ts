import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AUTH_SESSION_KEY } from './token-storage';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(AUTH_SESSION_KEY);
  });

  it('adjunta el header Authorization cuando hay un token guardado y la URL es de la API', () => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token: 'my-jwt' }));

    httpClient.get(`${environment.apiUrl}/vehicles`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt');
    req.flush({});
  });

  it('no adjunta el header cuando no hay sesión guardada', () => {
    httpClient.get(`${environment.apiUrl}/authentication/sign-in`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/authentication/sign-in`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('no adjunta el header a una URL fuera de environment.apiUrl aunque haya token guardado', () => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token: 'my-jwt' }));

    httpClient.get('./assets/i18n/es.json').subscribe();

    const req = httpMock.expectOne('./assets/i18n/es.json');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
