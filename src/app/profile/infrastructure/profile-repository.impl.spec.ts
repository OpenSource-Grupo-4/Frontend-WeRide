import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfileRepositoryImpl } from './profile-repository.impl';
import { environment } from '../../../environments/environment';

describe('ProfileRepositoryImpl', () => {
  let repository: ProfileRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfileRepositoryImpl, provideHttpClient(), provideHttpClientTesting()]
    });
    repository = TestBed.inject(ProfileRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('createProfile llama a POST /profiles con firstName/lastName/email', () => {
    repository.createProfile({ firstName: 'Nico', lastName: 'Ramos', email: 'nico@weride.com' })
      .subscribe(profile => {
        expect(profile.id).toBe(3);
        expect(profile.fullName).toBe('Nico Ramos');
      });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.profiles}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.firstName).toBe('Nico');
    expect(req.request.body.lastName).toBe('Ramos');
    expect(req.request.body.email).toBe('nico@weride.com');
    req.flush({ id: 3, userId: 7, firstName: 'Nico', lastName: 'Ramos', email: 'nico@weride.com' });
  });

  it('getProfile llama a GET /profiles/{id}', () => {
    repository.getProfile(3).subscribe(profile => {
      expect(profile.email).toBe('nico@weride.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.profiles}/3`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 3, userId: 7, firstName: 'Nico', lastName: 'Ramos', email: 'nico@weride.com' });
  });

  it('traduce un 404 a "Perfil no encontrado"', () => {
    let receivedError: Error | undefined;
    repository.getProfile(999).subscribe({ error: err => (receivedError = err) });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.profiles}/999`);
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    expect(receivedError?.message).toBe('Perfil no encontrado');
  });

  it('traduce un 401 a mensaje de sesión inválida', () => {
    let receivedError: Error | undefined;
    repository.createProfile({ firstName: 'Nico', lastName: 'Ramos', email: 'nico@weride.com' })
      .subscribe({ error: err => (receivedError = err) });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.profiles}`);
    req.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(receivedError?.message).toBe('Sesión inválida, iniciá sesión de nuevo');
  });
});
