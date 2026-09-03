import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehiclesApiEndpoint } from './vehicles-api-endpoint';
import { environment } from '../../../environments/environment';

describe('VehiclesApiEndpoint - normalización de ids', () => {
  let service: VehiclesApiEndpoint;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.vehicles}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VehiclesApiEndpoint, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(VehiclesApiEndpoint);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll normaliza ids numéricos del backend real a string', () => {
    service.getAll().subscribe(vehicles => {
      expect(vehicles.length).toBe(1);
      expect(vehicles[0].id).toBe('7');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 7, brand: 'Xiaomi', model: 'M365' } as any]);
  });

  it('getById normaliza el id numérico a string', () => {
    service.getById('7').subscribe(vehicle => {
      expect(vehicle.id).toBe('7');
    });

    const req = httpMock.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7 } as any);
  });

  it('convierte un id ausente a string vacío en vez de "undefined"', () => {
    service.getAll().subscribe(vehicles => {
      expect(vehicles[0].id).toBe('');
    });

    const req = httpMock.expectOne(baseUrl);
    req.flush([{ brand: 'Xiaomi' } as any]);
  });
});
