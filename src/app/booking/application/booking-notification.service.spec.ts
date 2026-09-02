import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BookingNotificationService } from './booking-notification.service';
import { NotificationsApiEndpoint } from '../infraestructure/notifications-api-endpoint';
import { BookingsApiEndpoint } from '../infraestructure/bookings-api-endpoint';
import { BookingResponse } from '../infraestructure/bookings-response';
import { Booking } from '../domain/model/booking.entity';
import { AuthStore } from '../../auth/application/auth.store';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<any> {
    return of({});
  }
}

describe('BookingNotificationService', () => {
  let bookingsApi: jasmine.SpyObj<BookingsApiEndpoint>;
  let authStore: {
    currentUser: WritableSignal<{ id: string } | null>;
    session: WritableSignal<{ isAuthenticated: boolean } | null>;
  };

  beforeEach(() => {
    bookingsApi = jasmine.createSpyObj<BookingsApiEndpoint>('BookingsApiEndpoint', ['getByUserId']);
    bookingsApi.getByUserId.and.returnValue(of([]));
    const notificationsApi = jasmine.createSpyObj<NotificationsApiEndpoint>('NotificationsApiEndpoint', ['create']);

    authStore = {
      currentUser: signal({ id: 'user-1' }),
      session: signal({ isAuthenticated: true })
    };

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
        { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) },
        { provide: NotificationsApiEndpoint, useValue: notificationsApi },
        { provide: BookingsApiEndpoint, useValue: bookingsApi },
        { provide: AuthStore, useValue: authStore }
      ]
    });
  });

  afterEach(() => {
    // Make sure no interval survives between tests
    const service = TestBed.inject(BookingNotificationService);
    service.stopMonitoring();
  });

  it('starts an interval that checks bookings', fakeAsync(() => {
    const service = TestBed.inject(BookingNotificationService);
    spyOn<any>(service, 'checkActiveBookings');

    service.startMonitoring();

    expect((service as any).checkInterval).toBeDefined();

    tick(60000); // CHECK_INTERVAL_MS is 60000
    // Called once immediately on start + once after the interval elapses
    expect((service as any).checkActiveBookings).toHaveBeenCalledTimes(2);
  }));

  it('is idempotent — calling startMonitoring twice keeps one interval', fakeAsync(() => {
    const service = TestBed.inject(BookingNotificationService);
    spyOn<any>(service, 'checkActiveBookings');

    service.startMonitoring();
    const firstInterval = (service as any).checkInterval;

    // Forget the immediate check from the first call, then confirm the second
    // startMonitoring is a no-op and a single interval fires exactly once.
    (service as any).checkActiveBookings.calls.reset();
    service.startMonitoring();
    expect((service as any).checkInterval).toBe(firstInterval);

    tick(60000);
    expect((service as any).checkActiveBookings).toHaveBeenCalledTimes(1);

    service.stopMonitoring();
    expect((service as any).checkInterval).toBeUndefined();
  }));

  it('does not fetch bookings for unauthenticated users', () => {
    authStore.session.set({ isAuthenticated: false });
    const service = TestBed.inject(BookingNotificationService);

    service.startMonitoring();

    expect(bookingsApi.getByUserId).not.toHaveBeenCalled();
  });

  it('fetches active bookings for authenticated users and runs the per-booking checks', fakeAsync(() => {
    const booking: BookingResponse = {
      id: 'b-1',
      userId: 'user-1',
      vehicleId: 'v-1',
      startLocationId: 'sl-1',
      endLocationId: 'el-1',
      reservedAt: '2026-01-01T10:00:00.000Z',
      startDate: new Date(Date.now() + 30_000).toISOString(),
      endDate: new Date(Date.now() + 120_000).toISOString(),
      actualStartDate: null,
      actualEndDate: null,
      status: 'confirmed',
      totalCost: 10,
      discount: 0,
      finalCost: 10,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      distance: null,
      duration: null,
      averageSpeed: null,
      rating: null,
      issues: []
    };
    bookingsApi.getByUserId.and.returnValue(of([booking]));

    const service = TestBed.inject(BookingNotificationService);
    spyOn<any>(service, 'checkBookingStart');
    spyOn<any>(service, 'checkBookingExpiring');
    spyOn<any>(service, 'checkBookingExpired');

    service.startMonitoring();

    expect(bookingsApi.getByUserId).toHaveBeenCalledWith('user-1');
    // Responses are mapped to domain bookings (Date fields) before the checks run
    expect((service as any).checkBookingStart).toHaveBeenCalledWith(jasmine.any(Booking), jasmine.any(Date));
    expect((service as any).checkBookingExpiring).toHaveBeenCalledWith(jasmine.any(Booking), jasmine.any(Date));
    expect((service as any).checkBookingExpired).toHaveBeenCalledWith(jasmine.any(Booking), jasmine.any(Date));
  }));

  it('does not run checks when a response arrives after stopMonitoring', fakeAsync(() => {
    const booking: BookingResponse = {
      id: 'b-late',
      userId: 'user-1',
      vehicleId: 'v-1',
      startLocationId: 'sl-1',
      endLocationId: 'el-1',
      reservedAt: '2026-01-01T10:00:00.000Z',
      startDate: new Date(Date.now() + 30_000).toISOString(),
      endDate: new Date(Date.now() + 120_000).toISOString(),
      actualStartDate: null,
      actualEndDate: null,
      status: 'confirmed',
      totalCost: 10,
      discount: 0,
      finalCost: 10,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      distance: null,
      duration: null,
      averageSpeed: null,
      rating: null,
      issues: []
    };
    const pending$ = new Subject<BookingResponse[]>();
    bookingsApi.getByUserId.and.returnValue(pending$);

    const service = TestBed.inject(BookingNotificationService);
    spyOn<any>(service, 'checkBookingStart');
    spyOn<any>(service, 'checkBookingExpiring');
    spyOn<any>(service, 'checkBookingExpired');

    service.startMonitoring();
    expect(bookingsApi.getByUserId).toHaveBeenCalledTimes(1);

    service.stopMonitoring();

    // The in-flight request resolves *after* monitoring stopped (e.g. logout or
    // ngOnDestroy): its response must not trigger any notification side effects.
    pending$.next([booking]);
    pending$.complete();

    expect((service as any).checkBookingStart).not.toHaveBeenCalled();
    expect((service as any).checkBookingExpiring).not.toHaveBeenCalled();
    expect((service as any).checkBookingExpired).not.toHaveBeenCalled();
  }));

  it('does not start an overlapping fetch while one is in flight', fakeAsync(() => {
    const pending$ = new Subject<BookingResponse[]>();
    bookingsApi.getByUserId.and.returnValue(pending$);

    const service = TestBed.inject(BookingNotificationService);

    (service as any).checkActiveBookings();
    (service as any).checkActiveBookings();

    expect(bookingsApi.getByUserId).toHaveBeenCalledTimes(1);

    // Resolving the pending request releases the guard…
    pending$.next([]);
    expect((service as any).fetchInFlight).toBe(false);

    // …so the next check can start another fetch.
    (service as any).checkActiveBookings();
    expect(bookingsApi.getByUserId).toHaveBeenCalledTimes(2);
    pending$.complete();
  }));

  it('resets the in-flight guard when the fetch errors', fakeAsync(() => {
    const failing$ = new Subject<BookingResponse[]>();
    bookingsApi.getByUserId.and.returnValue(failing$);

    const service = TestBed.inject(BookingNotificationService);
    spyOn(console, 'error');

    (service as any).checkActiveBookings();
    expect((service as any).fetchInFlight).toBe(true);

    failing$.error(new Error('network error'));
    expect((service as any).fetchInFlight).toBe(false);

    (service as any).checkActiveBookings();
    expect(bookingsApi.getByUserId).toHaveBeenCalledTimes(2);
  }));
});
