import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, of } from 'rxjs';

import { TripDetails } from './trip-details';
import { TripStore } from '../../../application/trip.store';
import { BookingStore } from '../../../../booking/application/booking.store';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { TripInitializerService } from '../../../application/trip-initializer.service';
import { TripsApiEndpoint } from '../../../infrastructure/trips-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infrastructure/vehicles-api-endpoint';
import { LocationsApiEndpoint } from '../../../infrastructure/locations-api-endpoint';
import { Trip } from '../../../domain/model/trip.entity';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('TripDetails', () => {
  let component: TripDetails;
  let fixture: ComponentFixture<TripDetails>;
  let routerSpy: jasmine.SpyObj<Router>;
  let tripStore: jasmine.SpyObj<TripStore>;
  let bookingStore: jasmine.SpyObj<BookingStore>;
  let tripsApi: jasmine.SpyObj<TripsApiEndpoint>;
  let vehiclesApi: jasmine.SpyObj<VehiclesApiEndpoint>;
  let locationsApi: jasmine.SpyObj<LocationsApiEndpoint>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'getCurrentNavigation']);
    routerSpy.navigate.and.resolveTo(true);
    // Sin navegación con state por defecto: los tests existentes no navegan.
    routerSpy.getCurrentNavigation.and.returnValue(null);

    // TripStore is only read through its signal getters here; build the stub
    // as a plain object with spy getters (cast needed: the signal-typed
    // members of TripStore are writable as plain stubbed functions in tests).
    tripStore = {} as jasmine.SpyObj<TripStore>;
    tripStore.isActiveTrip = jasmine.createSpy('isActiveTrip').and.returnValue(false) as any;
    tripStore.currentVehicle = jasmine.createSpy('currentVehicle').and.returnValue(null) as any;
    tripStore.currentLocation = jasmine.createSpy('currentLocation').and.returnValue(null) as any;
    tripStore.destinationLocation = jasmine.createSpy('destinationLocation').and.returnValue(null) as any;
    tripStore.tripStartTime = jasmine.createSpy('tripStartTime').and.returnValue(null) as any;
    tripStore.estimatedEndTime = jasmine.createSpy('estimatedEndTime').and.returnValue(null) as any;

    bookingStore = jasmine.createSpyObj<BookingStore>('BookingStore', [
      'getActiveBooking$', 'activateBooking'
    ]);
    bookingStore.getActiveBooking$.and.returnValue(of(null));
    bookingStore.activateBooking.and.resolveTo();

    const activeBookingService = jasmine.createSpyObj<ActiveBookingService>('ActiveBookingService', [
      'getActiveBooking'
    ]);
    activeBookingService.getActiveBooking.and.returnValue(null);

    const tripInitializer = jasmine.createSpyObj<TripInitializerService>('TripInitializerService', [
      'canInitializeTripFromBooking', 'initializeTripFromBooking'
    ]);
    tripInitializer.canInitializeTripFromBooking.and.returnValue(false);
    tripInitializer.initializeTripFromBooking.and.resolveTo(false);

    // Endpoints de infraestructura usados al cargar un viaje desde el historial.
    tripsApi = jasmine.createSpyObj<TripsApiEndpoint>('TripsApiEndpoint', ['getById']);
    vehiclesApi = jasmine.createSpyObj<VehiclesApiEndpoint>('VehiclesApiEndpoint', ['getById']);
    locationsApi = jasmine.createSpyObj<LocationsApiEndpoint>('LocationsApiEndpoint', ['getById']);

    await TestBed.configureTestingModule({
      imports: [
        TripDetails,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: routerSpy },
        { provide: TripStore, useValue: tripStore },
        { provide: BookingStore, useValue: bookingStore },
        { provide: ActiveBookingService, useValue: activeBookingService },
        { provide: TripInitializerService, useValue: tripInitializer },
        { provide: TripsApiEndpoint, useValue: tripsApi },
        { provide: VehiclesApiEndpoint, useValue: vehiclesApi },
        { provide: LocationsApiEndpoint, useValue: locationsApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to the existing user route from settings', () => {
    component.goToSettings();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/user']);
  });

  it('loads the trip selected from history via router state tripId', fakeAsync(() => {
    const trip: Trip = {
      id: 'trip-9',
      bookingId: 'b-9',
      userId: 'user-1',
      vehicleId: 'vehicle-1',
      startLocationId: 'loc-1',
      endLocationId: 'loc-2',
      route: 'A → B',
      routeCoordinates: [],
      startDate: '2026-01-15T10:30:00Z',
      endDate: '2026-01-15T11:00:00Z',
      duration: 30,
      distance: 5,
      averageSpeed: 10,
      maxSpeed: 20,
      totalCost: 3,
      carbonSaved: 0.2,
      caloriesBurned: 120,
      weather: 'clear',
      temperature: 20,
      status: 'completed',
      incidentReports: [],
      photos: []
    };
    (tripsApi.getById as jasmine.Spy).and.returnValue(of(trip));
    (vehiclesApi.getById as jasmine.Spy).and.returnValue(of({ id: 'vehicle-1', brand: 'Xiaomi', model: 'M365' }));
    (locationsApi.getById as jasmine.Spy).and.returnValue(of({ id: 'loc-1', name: 'Lima' }));

    (routerSpy.getCurrentNavigation as jasmine.Spy).and.returnValue({
      extras: { state: { tripId: 'trip-9' } }
    });

    component.ngOnInit();
    tick();

    expect(component.selectedTrip()?.id).toBe('trip-9');
    expect(tripsApi.getById).toHaveBeenCalledWith('trip-9');
  }));
});
