import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MapService, provideMapboxGL } from 'ngx-mapbox-gl';
import { Observable, Subject, of } from 'rxjs';

import { TripMap } from './trip-map';
import { VehicleDetailsModal } from '../../../../garage/presentation/views/vehicle-details-modal/vehicle-details-modal';
import { Vehicle } from '../../../domain/model/vehicle.entity';
import { Location } from '../../../domain/model/location.entity';
import { TripStore } from '../../../application/trip.store';
import { LocationsApiEndpoint } from '../../../infrastructure/locations-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infrastructure/vehicles-api-endpoint';
import { ProblemReportsApiEndpoint } from '../../../infrastructure/problem-reports-api-endpoint';
import { RatingsApiEndpoint } from '../../../infrastructure/ratings-api-endpoint';
import { TripsApiEndpoint } from '../../../infrastructure/trips-api-endpoint';
import { TravelHistoryApiEndpoint } from '../../../infrastructure/travel-history-api-endpoint';
import { OfflineSyncService } from '../../../application/offline-sync.service';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { TripInitializerService } from '../../../application/trip-initializer.service';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';

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
    rating: 4.5
  };
}

function createLocation(id = 'loc-1'): Location {
  return {
    id,
    name: 'Lima',
    address: 'Av. Larco 123',
    coordinates: { lat: -12.12, lng: -77.03 },
    type: 'station',
    capacity: 10,
    availableSpots: 5,
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59' },
    amenities: [],
    district: 'Miraflores',
    description: '',
    image: ''
  };
}

describe('TripMap', () => {
  let component: TripMap;
  let fixture: ComponentFixture<TripMap>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let tripStore: jasmine.SpyObj<TripStore>;
  let locationsApi: jasmine.SpyObj<LocationsApiEndpoint>;
  let vehiclesApi: jasmine.SpyObj<VehiclesApiEndpoint>;
  let problemReportsApi: jasmine.SpyObj<ProblemReportsApiEndpoint>;
  let ratingsApi: jasmine.SpyObj<RatingsApiEndpoint>;
  let tripsApi: jasmine.SpyObj<TripsApiEndpoint>;
  let travelHistoryApi: jasmine.SpyObj<TravelHistoryApiEndpoint>;
  let offlineSyncService: jasmine.SpyObj<OfflineSyncService>;
  let activeBookingService: jasmine.SpyObj<ActiveBookingService>;
  let tripInitializer: jasmine.SpyObj<TripInitializerService>;
  let currentUserView: jasmine.SpyObj<CurrentUserViewService>;
  let mapService: jasmine.SpyObj<MapService>;

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    tripStore = jasmine.createSpyObj<TripStore>('TripStore', [
      'setLoading', 'setConnectionError', 'setLocations', 'setVehicles',
      'setSelectedLocation', 'setNearbyVehicles', 'setCurrentVehicle',
      'setCurrentLocation', 'setDestinationLocation', 'startTrip', 'endTrip',
      'setCurrentTrip', 'setActiveBookingId'
    ]);
    // Signal getters consumed by the component are functions on the store.
    // (cast needed: the signal-typed members of TripStore are writable as
    // plain stubbed functions in the test.)
    tripStore.vehicles = jasmine.createSpy('vehicles').and.returnValue([]) as any;
    tripStore.locations = jasmine.createSpy('locations').and.returnValue([]) as any;
    tripStore.nearbyVehicles = jasmine.createSpy('nearbyVehicles').and.returnValue([]) as any;
    tripStore.selectedLocation = jasmine.createSpy('selectedLocation').and.returnValue(null) as any;
    tripStore.connectionError = jasmine.createSpy('connectionError').and.returnValue(false) as any;
    tripStore.isActiveTrip = jasmine.createSpy('isActiveTrip').and.returnValue(false) as any;
    tripStore.currentVehicle = jasmine.createSpy('currentVehicle').and.returnValue(null) as any;
    tripStore.currentLocation = jasmine.createSpy('currentLocation').and.returnValue(null) as any;
    tripStore.destinationLocation = jasmine.createSpy('destinationLocation').and.returnValue(null) as any;
    tripStore.tripStartTime = jasmine.createSpy('tripStartTime').and.returnValue(null) as any;
    tripStore.estimatedEndTime = jasmine.createSpy('estimatedEndTime').and.returnValue(null) as any;
    tripStore.currentTrip = jasmine.createSpy('currentTrip').and.returnValue(null) as any;
    locationsApi = jasmine.createSpyObj<LocationsApiEndpoint>('LocationsApiEndpoint', ['getAll']);
    vehiclesApi = jasmine.createSpyObj<VehiclesApiEndpoint>('VehiclesApiEndpoint', ['getAll']);
    problemReportsApi = jasmine.createSpyObj<ProblemReportsApiEndpoint>('ProblemReportsApiEndpoint', ['create']);
    ratingsApi = jasmine.createSpyObj<RatingsApiEndpoint>('RatingsApiEndpoint', ['create']);
    tripsApi = jasmine.createSpyObj<TripsApiEndpoint>('TripsApiEndpoint', ['create']);
    travelHistoryApi = jasmine.createSpyObj<TravelHistoryApiEndpoint>('TravelHistoryApiEndpoint', ['create']);
    offlineSyncService = jasmine.createSpyObj<OfflineSyncService>('OfflineSyncService', [
      'getPendingCount', 'syncAll'
    ]);
    activeBookingService = jasmine.createSpyObj<ActiveBookingService>('ActiveBookingService', [
      'getActiveBooking'
    ]);
    tripInitializer = jasmine.createSpyObj<TripInitializerService>('TripInitializerService', [
      'canInitializeTripFromBooking', 'initializeTripFromBooking'
    ]);
    currentUserView = jasmine.createSpyObj<CurrentUserViewService>('CurrentUserViewService', [
      'getCurrentUser$'
    ]);
    // Prevent the real mapbox Map from being constructed during the render
    // pass (afterNextRender): a stub MapService with a fully-resolved
    // mapCreated$ subject is enough for the map/marker components.
    mapService = jasmine.createSpyObj<MapService>('MapService', [
      'setup', 'destroyMap'
    ]);
    const mapCreated = new Subject<void>();
    mapCreated.next(undefined);
    mapCreated.complete();
    mapService.mapCreated$ = mapCreated.asObservable();
    (mapService as any)['mapCreated'] = mapCreated;

    // Defaults: no active booking/trip, empty lists, dialogs never resolve.
    // openVehicleDetails reads dialogRef.componentInstance.dialogRef.afterClosed.
    dialog.open.and.returnValue({
      componentInstance: { dialogRef: { afterClosed: () => of(null) } }
    } as any);
    locationsApi.getAll.and.returnValue(of([]));
    vehiclesApi.getAll.and.returnValue(of([]));
    offlineSyncService.getPendingCount.and.returnValue({ problemReports: 0, ratings: 0, total: 0 });
    activeBookingService.getActiveBooking.and.returnValue(null);
    tripInitializer.canInitializeTripFromBooking.and.returnValue(false);
    tripInitializer.initializeTripFromBooking.and.resolveTo(false);
    currentUserView.getCurrentUser$.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        TripMap,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideMapboxGL({ accessToken: 'test-token' }),
        { provide: MapService, useValue: mapService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: TripStore, useValue: tripStore },
        { provide: LocationsApiEndpoint, useValue: locationsApi },
        { provide: VehiclesApiEndpoint, useValue: vehiclesApi },
        { provide: ProblemReportsApiEndpoint, useValue: problemReportsApi },
        { provide: RatingsApiEndpoint, useValue: ratingsApi },
        { provide: TripsApiEndpoint, useValue: tripsApi },
        { provide: TravelHistoryApiEndpoint, useValue: travelHistoryApi },
        { provide: OfflineSyncService, useValue: offlineSyncService },
        { provide: ActiveBookingService, useValue: activeBookingService },
        { provide: TripInitializerService, useValue: tripInitializer },
        { provide: CurrentUserViewService, useValue: currentUserView }
      ]
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(TripMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Stop the interval started by ngOnInit (1s trip-update ticker).
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('routes reserve through schedule-unlock (real booking) instead of a random local trip', () => {
    const vehicle = createVehicle();
    const dialogRef = {
      componentInstance: { dialogRef: { afterClosed: () => of('reserve') } }
    };
    dialog.open.and.returnValue(dialogRef as any);

    component.openVehicleDetails(vehicle);
    expect(dialog.open).toHaveBeenCalledWith(
      VehicleDetailsModal,
      jasmine.objectContaining({ data: vehicle })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/schedule-unlock'], {
      state: { vehicle, immediate: true }
    });
    // The random-destination + local startTrip path must be gone.
    expect(tripStore.startTrip).not.toHaveBeenCalled();
    expect(tripStore.setCurrentVehicle).not.toHaveBeenCalled();
    expect(tripStore.setCurrentLocation).not.toHaveBeenCalled();
    expect(tripStore.setDestinationLocation).not.toHaveBeenCalled();
  });

  it('does not navigate when the details modal is dismissed', () => {
    const vehicle = createVehicle();
    // Default dialog stub resolves null (dismissed / closed without reserve).
    component.openVehicleDetails(vehicle);

    expect(dialog.open).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(tripStore.startTrip).not.toHaveBeenCalled();
  });
});
