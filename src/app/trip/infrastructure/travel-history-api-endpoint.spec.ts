import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TravelHistoryApiEndpoint } from './travel-history-api-endpoint';
import { TravelHistoryEntry, CreateTravelHistoryRequest } from '../domain/model/travel-history.entity';
import { environment } from '../../../environments/environment';

describe('TravelHistoryApiEndpoint', () => {
  let service: TravelHistoryApiEndpoint;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.travelHistory}`;

  const entry: TravelHistoryEntry = {
    id: '1', userId: '42', location: 'Miraflores', vehicle: 'Xiaomi Pro 2',
    image: 'scooter.png', tripDuration: '00:15:00', travelDistance: '2.30',
    createdAt: '2026-07-26T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TravelHistoryApiEndpoint, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TravelHistoryApiEndpoint);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getByUserId llama a GET /travel-history/{userId}', () => {
    service.getByUserId('42').subscribe(entries => expect(entries).toEqual([entry]));

    const req = httpMock.expectOne(`${baseUrl}/42`);
    expect(req.request.method).toBe('GET');
    req.flush([entry]);
  });

  it('create llama a POST /travel-history con el body completo', () => {
    const request: CreateTravelHistoryRequest = {
      userId: '42', location: 'Miraflores', vehicle: 'Xiaomi Pro 2',
      image: 'scooter.png', tripDuration: '00:15:00', travelDistance: '2.30'
    };

    service.create(request).subscribe(result => expect(result).toEqual(entry));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(entry);
  });
});
