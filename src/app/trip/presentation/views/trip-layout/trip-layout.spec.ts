import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MapService, provideMapboxGL } from 'ngx-mapbox-gl';
import { Observable, of, Subject } from 'rxjs';

import { TripLayout } from './trip-layout';
import { TripMap } from '../trip-map/trip-map';
import { TripDetails } from '../trip-details/trip-details';
import { TripStore } from '../../../application/trip.store';
import { BookingStore } from '../../../../booking/application/booking.store';
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

describe('TripLayout', () => {
  let component: TripLayout;
  let fixture: ComponentFixture<TripLayout>;

  beforeEach(async () => {
    // TripLayout renders <app-trip-map> + <app-trip-details>, so every
    // dependency those children inject must be provided. Each child's setup is
    // mirrored from trip-map.spec.ts / trip-details.spec.ts.
    const dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    const snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    snackBar.open.and.returnValue({ onAction: () => of(null) } as any);
    dialog.open.and.returnValue({
      componentInstance: { dialogRef: { afterClosed: () => of(null) } }
    } as any);

    const tripStore = {} as jasmine.SpyObj<TripStore>;
    // Signal getters consumed by TripMap/TripDetails are plain spy functions.
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
    tripStore.activeBookingId = jasmine.createSpy('activeBookingId').and.returnValue(null) as any;
    for (const method of [
      'setLoading', 'setConnectionError', 'setLocations', 'setVehicles',
      'setSelectedLocation', 'setNearbyVehicles', 'setCurrentVehicle',
      'setCurrentLocation', 'setDestinationLocation', 'startTrip', 'endTrip',
      'setCurrentTrip', 'setActiveBookingId'
    ]) {
      (tripStore as any)[method] = jasmine.createSpy(method);
    }

    const bookingStore = jasmine.createSpyObj<BookingStore>('BookingStore', [
      'getActiveBooking$', 'activateBooking'
    ]);
    bookingStore.getActiveBooking$.and.returnValue(of(null));
    bookingStore.activateBooking.and.resolveTo();

    const locationsApi = jasmine.createSpyObj<LocationsApiEndpoint>('LocationsApiEndpoint', ['getAll']);
    locationsApi.getAll.and.returnValue(of([]));
    const vehiclesApi = jasmine.createSpyObj<VehiclesApiEndpoint>('VehiclesApiEndpoint', ['getAll']);
    vehiclesApi.getAll.and.returnValue(of([]));
    const problemReportsApi = jasmine.createSpyObj<ProblemReportsApiEndpoint>('ProblemReportsApiEndpoint', ['create']);
    const ratingsApi = jasmine.createSpyObj<RatingsApiEndpoint>('RatingsApiEndpoint', ['create']);
    const tripsApi = jasmine.createSpyObj<TripsApiEndpoint>('TripsApiEndpoint', ['create']);
    const travelHistoryApi = jasmine.createSpyObj<TravelHistoryApiEndpoint>('TravelHistoryApiEndpoint', ['create']);
    const offlineSyncService = jasmine.createSpyObj<OfflineSyncService>('OfflineSyncService', [
      'getPendingCount', 'syncAll'
    ]);
    offlineSyncService.getPendingCount.and.returnValue({ problemReports: 0, ratings: 0, total: 0 });
    const activeBookingService = jasmine.createSpyObj<ActiveBookingService>('ActiveBookingService', [
      'getActiveBooking'
    ]);
    activeBookingService.getActiveBooking.and.returnValue(null);
    const tripInitializer = jasmine.createSpyObj<TripInitializerService>('TripInitializerService', [
      'canInitializeTripFromBooking', 'initializeTripFromBooking'
    ]);
    tripInitializer.canInitializeTripFromBooking.and.returnValue(false);
    tripInitializer.initializeTripFromBooking.and.resolveTo(false);
    const currentUserView = jasmine.createSpyObj<CurrentUserViewService>('CurrentUserViewService', [
      'getCurrentUser$'
    ]);
    currentUserView.getCurrentUser$.and.returnValue(of(null));

    // Keep ngx-mapbox-gl's MapComponent from constructing a real Map.
    const mapService = jasmine.createSpyObj<MapService>('MapService', ['setup', 'destroyMap']);
    const mapCreated = new Subject<void>();
    mapCreated.next(undefined);
    mapCreated.complete();
    mapService.mapCreated$ = mapCreated.asObservable();
    (mapService as any)['mapCreated'] = mapCreated;

    await TestBed.configureTestingModule({
      imports: [
        TripLayout,
        TripMap,
        TripDetails,
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
        { provide: BookingStore, useValue: bookingStore },
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

    fixture = TestBed.createComponent(TripLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // TripMap/TripDetails start intervals & geolocation watchers on init;
    // destroying the fixture clears them.
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
