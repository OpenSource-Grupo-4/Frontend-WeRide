import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationsApiEndpoint } from './notifications-api-endpoint';
import { NotificationResponse } from './notifications-response';
import { environment } from '../../../environments/environment';

describe('NotificationsApiEndpoint', () => {
  let service: NotificationsApiEndpoint;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.notifications}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationsApiEndpoint, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(NotificationsApiEndpoint);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll(userId) manda el query param obligatorio que exige el backend real', () => {
    const mockNotifications: NotificationResponse[] = [];
    service.getAll('42').subscribe(n => expect(n).toEqual(mockNotifications));

    const req = httpMock.expectOne(`${baseUrl}?userId=42`);
    expect(req.request.method).toBe('GET');
    req.flush(mockNotifications);
  });

  it('markAsRead(id) llama a PATCH /notifications/{id}/read sin body', () => {
    service.markAsRead('n1').subscribe(result => expect(result).toBe('Notification marked as read'));

    const req = httpMock.expectOne(`${baseUrl}/n1/read`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    expect(req.request.responseType).toBe('text');
    req.flush('Notification marked as read');
  });
});
