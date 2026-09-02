import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { VehicleCard } from './vehicle-card';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { TripStore } from '../../../../trip/application/trip.store';
import { LocationsApiEndpoint } from '../../../../trip/infrastructure/locations-api-endpoint';
import { FavoriteStore } from '../../../application/favorite.store';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

function createVehicle(): Vehicle {
  return {
    id: 'v-1',
    brand: 'Xiaomi',
    model: 'M365',
    year: 2023,
    battery: 80,
    maxSpeed: 25,
    range: 30,
    weight: 12,
    color: 'black',
    licensePlate: 'ABC-123',
    location: 'loc-1',
    status: 'available',
    type: 'electric_scooter',
    companyId: 'c-1',
    pricePerMinute: 0.5,
    image: 'assets/vehicles/scooter.png',
    features: ['LED', 'GPS'],
    maintenanceStatus: 'ok',
    lastMaintenance: '2025-01-01',
    nextMaintenance: '2026-01-01',
    totalKilometers: 100,
    rating: 4.5,
    favorite: false
  };
}

describe('VehicleCard', () => {
  let component: VehicleCard;
  let fixture: ComponentFixture<VehicleCard>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let router: jasmine.SpyObj<Router>;
  let tripStore: jasmine.SpyObj<TripStore>;
  let locationsApi: jasmine.SpyObj<LocationsApiEndpoint>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  // FavoriteStore is an ngrx signalStore instance; only its error() getter is
  // used by the component, so stub that surface.
  let favoriteStore: { error: jasmine.Spy };

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    tripStore = jasmine.createSpyObj<TripStore>('TripStore', [
      'setCurrentVehicle', 'setCurrentLocation', 'setLocations',
      'setDestinationLocation', 'startTrip'
    ]);
    locationsApi = jasmine.createSpyObj<LocationsApiEndpoint>('LocationsApiEndpoint', ['getAll']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    favoriteStore = { error: jasmine.createSpy('error') };

    // Default: modal opens and closes without a choice.
    dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
    locationsApi.getAll.and.returnValue(of([]));
    favoriteStore.error.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [
        VehicleCard,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: router },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: TripStore, useValue: tripStore },
        { provide: LocationsApiEndpoint, useValue: locationsApi },
        { provide: FavoriteStore, useValue: favoriteStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleCard);
    component = fixture.componentInstance;
    component.vehicle = createVehicle();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('routes book_now through the reserve event (real booking flow) instead of a random local trip', () => {
    // Modal "Reservar Ahora" closes with action book_now.
    dialog.open.and.returnValue({ afterClosed: () => of({ action: 'book_now' }) } as any);
    spyOn(component.reserve, 'emit');

    component.onReserve();

    // The parent (garage-layout) receives the vehicle and navigates to
    // /schedule-unlock, where a REAL booking is created via the API.
    expect(component.reserve.emit).toHaveBeenCalledWith(component.vehicle);
    // No random destination is picked and no local trip is started.
    expect(tripStore.startTrip).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('emits reserve for schedule action too', () => {
    // Modal "Programar Reserva" closes with action schedule.
    dialog.open.and.returnValue({ afterClosed: () => of({ action: 'schedule' }) } as any);
    spyOn(component.reserve, 'emit');

    component.onReserve();

    expect(component.reserve.emit).toHaveBeenCalledWith(component.vehicle);
    expect(tripStore.startTrip).not.toHaveBeenCalled();
  });
});
