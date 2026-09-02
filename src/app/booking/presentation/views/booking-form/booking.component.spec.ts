import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
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

  it('saveDraft does not persist a draft while canSubmit is false', () => {
    component.selectedVehicle = '';
    component.startLocationId = '';
    component.endLocationId = '';
    component.saveDraft();

    expect(draftService.saveDraft).not.toHaveBeenCalled();
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
});
