import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, Subject, of, throwError } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BookingFormComponent } from './booking';
import { BookingStorageService } from '../../../application/booking-storage.service';
import { BookingStore } from '../../../application/booking.store';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infraestructure/vehicles-api-endpoint';
import { LocationsApiEndpoint } from '../../../infraestructure/locations-api-endpoint';
import { DraftBookingService } from '../../../application/draft-booking.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

function fillValidBooking(component: BookingFormComponent): void {
  component.selectedVehicle = 'v-1';
  component.startLocationId = 'loc-a';
  component.endLocationId = 'loc-b';
  component.selectedDate = '2026-09-02';
  component.unlockTime = '10:00';
  component.duration = 30;
}

describe('BookingFormComponent', () => {
  let component: BookingFormComponent;
  let fixture: ComponentFixture<BookingFormComponent>;
  let vehiclesApi: jasmine.SpyObj<VehiclesApiEndpoint>;
  let locationsApi: jasmine.SpyObj<LocationsApiEndpoint>;
  let bookingsApi: jasmine.SpyObj<BookingsApiEndpoint>;
  let bookingStorage: jasmine.SpyObj<BookingStorageService>;
  let bookingStore: jasmine.SpyObj<BookingStore>;
  let draftService: jasmine.SpyObj<DraftBookingService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    vehiclesApi = jasmine.createSpyObj('VehiclesApiEndpoint', ['getAll', 'create', 'getById', 'update', 'delete']);
    locationsApi = jasmine.createSpyObj('LocationsApiEndpoint', ['getAll', 'create', 'getById', 'update', 'delete']);
    bookingsApi = jasmine.createSpyObj('BookingsApiEndpoint', [
      'getAll', 'create', 'getById', 'update', 'delete', 'getByUserId', 'getByVehicleId',
      'getDrafts', 'getByStatus', 'getPendingByUser', 'getCompletedByUser'
    ]);
    bookingStorage = jasmine.createSpyObj('BookingStorageService', [
      'getBookings', 'getBookingById', 'saveBooking', 'updateBooking', 'deleteBooking',
      'clearAllBookings', 'isStorageAvailable', 'cancelBooking'
    ]);
    bookingStore = jasmine.createSpyObj('BookingStore', [
      'getBookings', 'addBooking', 'updateBooking', 'deleteBooking', 'selectBooking',
      'getSelectedBooking', 'clearSelectedBooking', 'loadFromLocalStorage', 'syncToLocalStorage',
      'getBookingById', 'getActiveBooking$', 'setActiveBooking', 'activateBooking',
      'unlockVehicleByQR', 'unlockVehicleManually', 'getBookingByIdAsync'
    ]);
    draftService = jasmine.createSpyObj('DraftBookingService', ['saveDraft', 'deleteDraft', 'getDrafts']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    vehiclesApi.getAll.and.returnValue(of([]));
    locationsApi.getAll.and.returnValue(of([]));
    bookingStorage.getBookingById.and.returnValue(null);
    draftService.saveDraft.and.returnValue(of({} as any));

    TestBed.configureTestingModule({
      imports: [
        BookingFormComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => null }) } },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: BookingStorageService, useValue: bookingStorage },
        { provide: BookingStore, useValue: bookingStore },
        { provide: BookingsApiEndpoint, useValue: bookingsApi },
        { provide: VehiclesApiEndpoint, useValue: vehiclesApi },
        { provide: LocationsApiEndpoint, useValue: locationsApi },
        { provide: DraftBookingService, useValue: draftService }
      ]
    });

    fixture = TestBed.createComponent(BookingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates and starts without a load failure', () => {
    expect(component).toBeTruthy();
    expect(component.locationsLoadFailed).toBeFalse();
    expect(component.vehiclesLoadFailed).toBeFalse();
  });

  it('loads only active locations and never silently auto-selects a default', () => {
    locationsApi.getAll.and.returnValue(of([
      { id: '1', name: 'One', address: 'Addr 1', isActive: true },
      { id: '2', name: 'Two', address: 'Addr 2', isActive: true },
      { id: '3', name: 'Inactive', address: 'Addr 3', isActive: false }
    ] as any));

    component.retryLoad();

    expect(component.locations.map((l) => l.id)).toEqual(['1', '2']);
    expect(component.startLocationId).toBe('');
    expect(component.endLocationId).toBe('');
  });

  it('does not silently pick default locations when locations fail to load', () => {
    spyOn(console, 'error');
    locationsApi.getAll.and.returnValue(throwError(() => new Error('network')));

    component.retryLoad();

    expect(component.startLocationId).toBe('');
    expect(component.endLocationId).toBe('');
    expect(component.locationsLoadFailed).toBeTrue();
    expect(component.locations).toEqual([]);
  });

  it('flags vehicles load failures and retry reloads them', () => {
    spyOn(console, 'error');
    vehiclesApi.getAll.and.returnValue(throwError(() => new Error('network')));

    component.retryLoad();
    expect(component.vehiclesLoadFailed).toBeTrue();

    const vehicle = { id: 'v-1', brand: 'Xiaomi', model: 'M365', pricePerMinute: 0.5 };
    vehiclesApi.getAll.and.returnValue(of([vehicle] as any));
    component.retryLoad();

    expect(component.vehiclesLoadFailed).toBeFalse();
    expect(component.vehicles).toEqual([vehicle] as any);
  });

  it('canSubmit requires vehicle, locations, date and duration', () => {
    component.selectedVehicle = '';
    component.startLocationId = '';
    component.endLocationId = '';
    component.duration = 1;
    expect(component.canSubmit).toBeFalse();

    component.selectedVehicle = '1';
    component.startLocationId = 'loc-A';
    component.endLocationId = 'loc-B';
    // selectedDate/unlockTime are initialized by ngOnInit
    expect(component.canSubmit).toBeTrue();
  });

  it('canSubmit is false while the duration is not a positive number', () => {
    fillValidBooking(component);
    component.duration = 0;
    expect(component.canSubmit).toBeFalse();

    component.duration = -5;
    expect(component.canSubmit).toBeFalse();
  });

  it('shows a price preview before submitting (total = rate x duration)', () => {
    component.vehicles = [{ id: '1', pricePerMinute: 0.5 } as any];
    component.selectedVehicle = '1';
    component.startLocationId = 'loc-A';
    component.endLocationId = 'loc-B';
    component.duration = 30;
    expect(component.calculateCost()).toBe(15);
    expect(component.showPricePreview).toBeTrue();
  });

  it('renders the pre-submit price preview once the booking is complete', () => {
    component.vehicles = [{ id: 'v-1', brand: 'Xiaomi', model: 'M365', type: 'scooter', pricePerMinute: 0.5 } as any];
    fillValidBooking(component);
    fixture.detectChanges();

    const preview = fixture.nativeElement.querySelector('.booking-summary--preview');
    expect(preview).not.toBeNull();
    expect(preview.textContent).toContain('15.00');
  });

  it('hides the price preview while the booking is incomplete', () => {
    component.selectedVehicle = '';
    fixture.detectChanges();
    expect(component.showPricePreview).toBeFalse();
    expect(fixture.nativeElement.querySelector('.booking-summary--preview')).toBeNull();
  });

  it('disables submit and explains why while fields are missing, and enables it when complete', () => {
    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    const saveDraftBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="button"]');

    expect(submitBtn.disabled).toBeTrue();
    expect(saveDraftBtn.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('.form-hint')).not.toBeNull();

    fillValidBooking(component);
    fixture.detectChanges();

    expect(submitBtn.disabled).toBeFalse();
    expect(saveDraftBtn.disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('.form-hint')).toBeNull();
  });

  it('enables the Save as Draft button with only a vehicle selected (no date/time yet)', () => {
    component.selectedVehicle = '';
    component.startLocationId = '';
    component.endLocationId = '';
    component.selectedDate = '';
    component.unlockTime = '';
    fixture.detectChanges();

    const saveDraftBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="button"]');
    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');

    // Nothing selected: draft is still not possible.
    expect(component.canSaveDraft).toBeFalse();
    expect(saveDraftBtn.disabled).toBeTrue();
    expect(submitBtn.disabled).toBeTrue();

    // A partial booking (vehicle only) can be saved as a draft but not submitted.
    component.selectedVehicle = 'v-1';
    fixture.detectChanges();

    expect(component.canSaveDraft).toBeTrue();
    expect(saveDraftBtn.disabled).toBeFalse();
    expect(submitBtn.disabled).toBeTrue();
  });

  it('saveDraft does not persist a draft while canSubmit is false', () => {
    component.selectedVehicle = '';
    component.startLocationId = '';
    component.endLocationId = '';
    component.saveDraft();

    expect(draftService.saveDraft).not.toHaveBeenCalled();
  });

  it('saveDraft persists a partial draft (vehicle only, no locations/date/time)', () => {
    component.selectedVehicle = 'v-1';
    component.selectedDate = '';
    component.unlockTime = '';
    component.saveDraft();

    expect(draftService.saveDraft).toHaveBeenCalledWith(jasmine.objectContaining({
      vehicleId: 'v-1',
      startLocationId: '',
      endLocationId: ''
    }));
  });

  it('saveDraft persists a draft once the booking is valid', () => {
    fillValidBooking(component);
    component.saveDraft();

    expect(draftService.saveDraft).toHaveBeenCalledWith(jasmine.objectContaining({
      vehicleId: 'v-1',
      startLocationId: 'loc-a',
      endLocationId: 'loc-b',
      durationMinutes: 30
    }));
  });

  it('saveDraft with no vehicle shows a translated error and does not persist', () => {
    spyOn(component as any, 'showErrorMessage');
    component.selectedVehicle = '';
    component.saveDraft();

    expect((component as any).showErrorMessage).toHaveBeenCalledWith('booking.form.missingFields');
    expect(draftService.saveDraft).not.toHaveBeenCalled();
  });

  it('hides the pre-submit preview after a successful submit (summary shown instead, never both)', fakeAsync(() => {
    component.vehicles = [{ id: '1', pricePerMinute: 0.5 } as any];
    component.selectedVehicle = '1';
    component.startLocationId = 'loc-A';
    component.endLocationId = 'loc-B';
    component.selectedDate = '2026-09-02';
    component.unlockTime = '10:00';
    component.duration = 30;
    bookingsApi.create.and.returnValue(of({} as any));

    component.submitBooking();

    expect(bookingsApi.create).toHaveBeenCalled();
    expect(component.showSummary).toBeTrue();
    expect(component.showPricePreview).toBeFalse();
    tick(2000);
  }));

  it('clears a stale vehicles load failure when an older success lands late', () => {
    spyOn(console, 'error');
    const older = new Subject<any>();
    const newer = new Subject<any>();
    vehiclesApi.getAll.and.returnValues(older, newer);
    const comp: any = component;

    // Older request starts first (still in flight)...
    comp.loadVehicles();
    // ...then a retry starts and fails fast, flagging the error.
    comp.loadVehicles();
    newer.error(new Error('network'));
    expect(component.vehiclesLoadFailed).toBeTrue();

    // The older request finally succeeds: it must clear the stale failure.
    older.next([{ id: 'v-1' } as any]);
    older.complete();

    expect(component.vehiclesLoadFailed).toBeFalse();
    expect(component.vehicles).toEqual([{ id: 'v-1' } as any]);
  });

  it('clears a stale locations load failure when an older success lands late', () => {
    spyOn(console, 'error');
    const older = new Subject<any>();
    const newer = new Subject<any>();
    locationsApi.getAll.and.returnValues(older, newer);
    const comp: any = component;

    comp.loadLocations();
    comp.loadLocations();
    newer.error(new Error('network'));
    expect(component.locationsLoadFailed).toBeTrue();

    older.next([{ id: '1', name: 'One', address: 'Addr', isActive: true } as any]);
    older.complete();

    expect(component.locationsLoadFailed).toBeFalse();
    expect(component.locations.map((l) => l.id)).toEqual(['1']);
  });

  it('formats the date input from local time components (no UTC day skew)', () => {
    // UTC-5 evening: 2026-09-02T23:30-05:00 is 2026-09-03T04:30Z — toISOString
    // would produce the wrong (next) day for the input.
    const local = new Date(2026, 8, 2, 23, 30);
    expect((component as any).formatDateForInput(local)).toBe('2026-09-02');
    expect((component as any).combineDateTime('2026-09-02', '23:30').getDate()).toBe(2);
  });

  it('applies an edit booking using local date formatting and restores valid duration', fakeAsync(() => {
    component.vehicles = [{ id: '2', pricePerMinute: 0.5 } as any];
    const subject = new Subject<any>();
    bookingsApi.getById.and.returnValue(subject);

    const route = TestBed.inject(ActivatedRoute) as any;
    (route as any).paramMap = of({ get: (key: string) => (key === 'id' ? 'b-1' : null) });
    component.ngOnInit();

    // startLocationId/endLocationId pick up the vehicle options only when loaded;
    // provide them directly as the API would after vehicles load.
    component.vehicles = [
      { id: '2', brand: 'Ninebot', model: 'Max', type: 'scooter' } as any,
      { id: '9', brand: 'Xiaomi', model: 'M365', type: 'scooter' } as any
    ];
    subject.next({
      id: 'b-1',
      vehicleId: '2',
      startLocationId: 'loc-a',
      endLocationId: 'loc-b',
      startDate: new Date(2026, 8, 2, 18, 45).toISOString(),
      duration: 45
    });
    subject.complete();

    expect(component.isEditMode).toBeTrue();
    expect(component.editingBookingId).toBe('b-1');
    expect(component.selectedVehicle).toBe('2');
    expect(component.selectedDate).toBe('2026-09-02');
    expect(component.duration).toBe(45);
    expect(component.canSubmit).toBeTrue();
  }));

  it('only one summary block renders after a successful submit', fakeAsync(() => {
    component.vehicles = [{ id: 'v-1', brand: 'Xiaomi', model: 'M365', type: 'scooter', pricePerMinute: 0.5 } as any];
    fillValidBooking(component);
    bookingsApi.create.and.returnValue(of({} as any));

    component.submitBooking();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.booking-summary').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.booking-summary--preview')).toBeNull();
    expect(fixture.nativeElement.querySelector('.booking-summary').textContent).toContain('15.00');
    tick(2000);
  }));

  it('resolves vehicle name/rate when the API returns numeric ids', () => {
    // El backend real responde ids numéricos.
    component.vehicles = [{ id: 7, brand: 'Xiaomi', model: 'Pro', pricePerMinute: 0.5 } as any];
    component.selectedVehicle = '7';

    expect(component.getVehicleName('7')).toBe('Xiaomi Pro');
    expect(component.rate).toBe(0.5);
  });
});
