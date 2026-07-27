import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookingsApiEndpoint } from './bookings-api-endpoint';
import { BookingResponse } from './bookings-response';
import { environment } from '../../../environments/environment';

describe('BookingsApiEndpoint - filtros por path param real', () => {
  let service: BookingsApiEndpoint;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingsApiEndpoint, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BookingsApiEndpoint);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getByUserId llama a GET /bookings/user/{userId} (no query param)', () => {
    const mockBookings: BookingResponse[] = [];
    service.getByUserId('42').subscribe(bookings => expect(bookings).toEqual(mockBookings));

    const req = httpMock.expectOne(`${baseUrl}/user/42`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBookings);
  });

  it('getByVehicleId llama a GET /bookings/vehicle/{vehicleId} (no query param)', () => {
    const mockBookings: BookingResponse[] = [];
    service.getByVehicleId('7').subscribe(bookings => expect(bookings).toEqual(mockBookings));

    const req = httpMock.expectOne(`${baseUrl}/vehicle/7`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBookings);
  });
});
