import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal, untracked, WritableSignal } from '@angular/core';
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
      // El servicio crea un effect sobre esta señal: el effect se ejecuta en el
      // primer tick() tras inyectar el servicio. Sesión false por defecto para
      // que los tests que arrancan el monitor manualmente (startMonitoring) no
      // reciban un arranque adicional del effect. Cada test que requiera sesión
      // activa la establece a true ANTES de inyectar el servicio.
      session: signal({ isAuthenticated: false })
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
    // Deja la señal de sesión limpia para el siguiente test (sin notificar al
    // effect, que ya no volverá a ejecutarse con el servicio destruido).
    untracked(() => authStore.session.set({ isAuthenticated: false }));
  });

  it('starts an interval that checks bookings', fakeAsync(() => {
    authStore.session.set({ isAuthenticated: true });
    const service = TestBed.inject(BookingNotificationService);
    spyOn<any>(service, 'checkActiveBookings');

    // El effect creado al inyectar el servicio arranca el monitor en el primer
    // tick (sesión autenticada). Detenlo y olvida esa llamada para probar el
    // arranque manual desde cero.
    tick();
    service.stopMonitoring();
    (service as any).checkActiveBookings.calls.reset();

    service.startMonitoring();

    expect((service as any).checkInterval).toBeDefined();

    tick(60000); // CHECK_INTERVAL_MS is 60000
    // Called once immediately on start + once after the interval elapses
    expect((service as any).checkActiveBookings).toHaveBeenCalledTimes(2);
  }));

  it('is idempotent — calling startMonitoring twice keeps one interval', fakeAsync(() => {
    authStore.session.set({ isAuthenticated: true });
    const service = TestBed.inject(BookingNotificationService);
    spyOn<any>(service, 'checkActiveBookings');

    // El effect de creación ya ha arrancado el monitor (isMonitoring true):
    // el primer startMonitoring manual es un no-op, lo que valida justo la
    // idempotencia que este test persigue.
    tick();
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

  it('does not fetch bookings for unauthenticated users', fakeAsync(() => {
    // Sesión no autenticada por defecto: inyectar el servicio no arranca el
    // monitor (el effect ve isAuthenticated false) y startMonitoring manual
    // tampoco dispara fetches.
    const service = TestBed.inject(BookingNotificationService);
    tick();

    service.startMonitoring();

    expect(bookingsApi.getByUserId).not.toHaveBeenCalled();
    service.stopMonitoring();
  }));

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
    authStore.session.set({ isAuthenticated: true });

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
    authStore.session.set({ isAuthenticated: true });

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
    authStore.session.set({ isAuthenticated: true });

    const service = TestBed.inject(BookingNotificationService);
    tick();

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
    service.stopMonitoring();
  }));

  it('resets the in-flight guard when the fetch errors', fakeAsync(() => {
    const failing$ = new Subject<BookingResponse[]>();
    bookingsApi.getByUserId.and.returnValue(failing$);
    authStore.session.set({ isAuthenticated: true });

    const service = TestBed.inject(BookingNotificationService);
    tick();
    spyOn(console, 'error');

    (service as any).checkActiveBookings();
    expect((service as any).fetchInFlight).toBe(true);

    failing$.error(new Error('network error'));
    expect((service as any).fetchInFlight).toBe(false);

    (service as any).checkActiveBookings();
    expect(bookingsApi.getByUserId).toHaveBeenCalledTimes(2);
    service.stopMonitoring();
  }));

  it('stops monitoring when the session becomes unauthenticated (logout)', fakeAsync(() => {
    authStore.session.set({ isAuthenticated: true });
    const service = TestBed.inject(BookingNotificationService);
    spyOn<any>(service, 'checkActiveBookings');

    service.startMonitoring();
    expect((service as any).isMonitoring).toBeTrue();

    authStore.session.set({ isAuthenticated: false });
    tick();

    expect((service as any).isMonitoring).toBeFalse();
    expect((service as any).checkInterval).toBeUndefined();
  }));

  it('resumes monitoring when a new session is authenticated (login)', fakeAsync(() => {
    // Sesión no autenticada (default del beforeEach): el effect no arranca el
    // monitor al crear el servicio y el startMonitoring manual queda anulado
    // por el effect en el siguiente tick.
    const service = TestBed.inject(BookingNotificationService);
    spyOn<any>(service, 'checkActiveBookings');

    service.startMonitoring();
    tick();
    expect((service as any).isMonitoring).toBeFalse();

    // Login: el effect debe arrancarlo.
    authStore.session.set({ isAuthenticated: true });
    tick();

    expect((service as any).isMonitoring).toBeTrue();
    service.stopMonitoring();
  }));
});
