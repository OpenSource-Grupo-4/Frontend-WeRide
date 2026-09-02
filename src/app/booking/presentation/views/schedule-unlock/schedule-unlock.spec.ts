import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ScheduleUnlockComponent } from './schedule-unlock';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { ActiveBookingService } from '../../../application/active-booking.service';
import { BookingStore } from '../../../application/booking.store';
import { UnlockRequestsApiEndpoint } from '../../../infraestructure/unlockRequests-api-endpoint';
import { DraftBookingService } from '../../../application/draft-booking.service';
import { LocationsApiEndpoint } from '../../../infraestructure/locations-api-endpoint';
import { Vehicle } from '../../../../garage/domain/model/vehicle.model';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({
      scheduleUnlock: {
        locationsLoadError: 'No se pudieron cargar las ubicaciones',
        perMinute: '/minuto'
      },
      common: {
        retry: 'Reintentar'
      },
      booking: {
        selectDate: 'Seleccionar Fecha',
        unlockTime: 'Hora de Desbloqueo',
        hours: 'horas',
        hour: 'hora',
        form: {
          startLocation: 'Ubicación de inicio',
          endLocation: 'Ubicación de destino'
        },
        summary: {
          title: 'Resumen de Reserva',
          vehicle: 'Vehículo',
          dateTime: 'Fecha y hora',
          duration: 'Duración',
          rate: 'Tarifa',
          total: 'Total'
        }
      }
    } as any);
  }
}

describe('ScheduleUnlockComponent', () => {
  let component: ScheduleUnlockComponent;
  let fixture: ComponentFixture<ScheduleUnlockComponent>;
  let locationsApi: jasmine.SpyObj<LocationsApiEndpoint>;

  const mockVehicle: Vehicle = {
    id: '1',
    brand: 'Xiaomi',
    model: 'M365',
    year: 2023,
    battery: 82,
    maxSpeed: 25,
    range: 30,
    weight: 12.5,
    color: 'black',
    licensePlate: 'XM001',
    location: '1',
    status: 'available',
    type: 'electric_scooter',
    companyId: '1',
    pricePerMinute: 0.5,
    image: 'assets/vehicles/xiaomi-m365.jpg',
    features: ['GPS'],
    maintenanceStatus: 'good',
    lastMaintenance: '2024-09-15T10:00:00Z',
    nextMaintenance: '2024-11-15T10:00:00Z',
    totalKilometers: 1250.5,
    rating: 4.6
  };

  beforeEach(async () => {
    locationsApi = jasmine.createSpyObj('LocationsApiEndpoint', ['getAll']);
    const bookingsApi = jasmine.createSpyObj('BookingsApiEndpoint', ['create', 'getByVehicleId', 'getById', 'getByUserId']);
    const activeBookingService = jasmine.createSpyObj('ActiveBookingService', ['getActiveBooking', 'setActiveBooking', 'clearActiveBooking']);
    const bookingStore = jasmine.createSpyObj('BookingStore', ['addBooking', 'updateBooking']);
    const unlockRequestsApi = jasmine.createSpyObj('UnlockRequestsApiEndpoint', ['create']);
    const draftService = jasmine.createSpyObj('DraftBookingService', ['saveDraft', 'deleteDraft', 'getDrafts']);
    draftService.drafts$ = of([]);
    const snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialog = jasmine.createSpyObj('MatDialog', ['open']);

    locationsApi.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        ScheduleUnlockComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } }),
        HttpClientTestingModule
      ],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
        { provide: BookingsApiEndpoint, useValue: bookingsApi },
        { provide: ActiveBookingService, useValue: activeBookingService },
        { provide: BookingStore, useValue: bookingStore },
        { provide: UnlockRequestsApiEndpoint, useValue: unlockRequestsApi },
        { provide: DraftBookingService, useValue: draftService },
        { provide: LocationsApiEndpoint, useValue: locationsApi }
      ]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('es');
    await firstValueFrom(translate.use('es'));

    fixture = TestBed.createComponent(ScheduleUnlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('flags a locations load failure and shows a retry button that reloads locations', () => {
    spyOn(console, 'error');
    locationsApi.getAll.and.returnValue(throwError(() => new Error('network')));
    component.loadLocations();
    fixture.detectChanges();

    expect(component.locationsLoadFailed).toBeTrue();
    const errorBlock = fixture.nativeElement.querySelector('.locations-load-error');
    expect(errorBlock).not.toBeNull();
    expect(errorBlock.textContent).toContain('No se pudieron cargar las ubicaciones');

    const locationA = { id: '1', name: 'Uno', address: 'Av A', isActive: true } as any;
    locationsApi.getAll.and.returnValue(of([locationA] as any));
    const retryBtn = errorBlock.querySelector('button');
    retryBtn.click();
    fixture.detectChanges();

    expect(component.locationsLoadFailed).toBeFalse();
    expect(component.locations.length).toBe(1);
    expect(fixture.nativeElement.querySelector('.locations-load-error')).toBeNull();
    expect(component.availabilityError).toBe('');
  });

  it('annotates the native date/time inputs with distinct accessible names', () => {
    const dateInput = fixture.nativeElement.querySelector('#date-input') as HTMLInputElement;
    const timeInput = fixture.nativeElement.querySelector('#time-input') as HTMLInputElement;
    expect(dateInput.getAttribute('aria-label')).toBe('Seleccionar Fecha');
    expect(timeInput.getAttribute('aria-label')).toBe('Hora de Desbloqueo');
  });

  it('shows a pre-confirm summary card with vehicle, locations, date/time, duration and total', () => {
    component.selectedVehicle = mockVehicle;
    component.locations = [
      { id: '1', name: 'Torre', address: 'Av A', isActive: true } as any,
      { id: '2', name: 'Parque', address: 'Calle B', isActive: true } as any
    ];
    component.startLocationId = '1';
    component.endLocationId = '2';
    component.duration = 2;
    component.unlockTime = '10:00';
    fixture.detectChanges();

    const summary = fixture.nativeElement.querySelector('.booking-summary-card');
    expect(summary).not.toBeNull();
    const text = summary.textContent;
    expect(text).toContain('Xiaomi M365');
    expect(text).toContain('Torre');
    expect(text).toContain('Parque');
    expect(text).toContain('2 horas');
    expect(component.calculateTotal()).toBe('60.00');
    expect(text).toContain('60.00');
  });
});
