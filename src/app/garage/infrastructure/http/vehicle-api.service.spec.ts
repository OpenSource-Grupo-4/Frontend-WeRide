import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleApiService, VehicleApiResponse, CreateVehicleRequest } from './vehicle-api.service';
import { environment } from '../../../../environments/environment';

describe('VehicleApiService - CRUD real', () => {
  let service: VehicleApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.vehicles}`;

  const requestBody: CreateVehicleRequest = {
    brand: 'Xiaomi', model: 'Pro 2', year: 2024, battery: 100, maxSpeed: 25,
    range: 40, weight: 14, color: 'negro', licensePlate: 'ABC-123',
    location: 'Miraflores', status: 'available', type: 'electric_scooter',
    companyId: 'weride', pricePerMinute: 0.5, image: 'scooter.png',
    features: ['gps'], maintenanceStatus: 'ok', lastMaintenance: '2026-01-01',
    nextMaintenance: '2026-06-01', totalKilometers: 0, rating: 5
  };

  const apiResponse: VehicleApiResponse = { id: '10', ...requestBody };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VehicleApiService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(VehicleApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('createVehicle llama a POST /vehicles con el body completo', async () => {
    const promise = service.createVehicle(requestBody);
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(requestBody);
    req.flush(apiResponse);
    expect(await promise).toEqual(apiResponse);
  });

  it('updateVehicle llama a PUT /vehicles/{id} con el body completo', async () => {
    const promise = service.updateVehicle('10', requestBody);
    const req = httpMock.expectOne(`${baseUrl}/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(requestBody);
    req.flush(apiResponse);
    expect(await promise).toEqual(apiResponse);
  });

  it('deleteVehicle llama a DELETE /vehicles/{id}', async () => {
    const promise = service.deleteVehicle('10');
    const req = httpMock.expectOne(`${baseUrl}/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await promise;
    expect().nothing();
  });
});
