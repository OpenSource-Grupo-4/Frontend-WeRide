import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TripsApiEndpoint } from './trips-api-endpoint';
import { Trip } from '../domain/model/trip.entity';
import { environment } from '../../../environments/environment';

describe('TripsApiEndpoint.getMine', () => {
  let service: TripsApiEndpoint;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.trips}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TripsApiEndpoint, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TripsApiEndpoint);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('llama a GET /trips sin ningún query param (el backend ya filtra por JWT)', () => {
    const mockTrips: Trip[] = [];
    service.getMine().subscribe(trips => expect(trips).toEqual(mockTrips));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(mockTrips);
  });
});
