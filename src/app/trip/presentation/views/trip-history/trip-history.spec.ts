import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { TripHistory } from './trip-history';
import { TripService } from '../../../../core/services/trip.service';
import { VehicleService } from '../../../../core/services/vehicle.service';
import { Trip } from '../../../domain/model/trip.entity';
import { Vehicle } from '../../../domain/model/vehicle.entity';

const HISTORY_PAGE_TRIPS = 7;

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

function makeTrip(id: string): Trip {
  return {
    id,
    bookingId: `booking-${id}`,
    userId: 'user-1',
    vehicleId: 'vehicle-1',
    startLocationId: 'location-1',
    endLocationId: 'location-2',
    route: 'Plaza Mayor → Jockey Plaza',
    routeCoordinates: [],
    startDate: new Date(2026, 0, 15, 10, 30).toISOString(),
    endDate: new Date(2026, 0, 15, 11, 0).toISOString(),
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
}

describe('TripHistory', () => {
  let component: TripHistory;
  let fixture: ComponentFixture<TripHistory>;
  let routerSpy: jasmine.SpyObj<Router>;
  let tripService: jasmine.SpyObj<TripService>;
  let vehicleService: jasmine.SpyObj<VehicleService>;
  let vehicle: Vehicle;

  beforeEach(async () => {
    vehicle = {
      id: 'vehicle-1',
      brand: 'Xiaomi',
      model: 'M365',
      year: 2024,
      battery: 90,
      maxSpeed: 25,
      range: 30,
      weight: 12,
      color: 'black',
      licensePlate: 'PLATE-1',
      location: 'A',
      status: 'available',
      type: 'scooter',
      companyId: 'company-1',
      pricePerMinute: 0.5,
      image: 'assets/vehicles/vehicle-1.jpg',
      features: [],
      maintenanceStatus: 'ok',
      lastMaintenance: '2026-01-01',
      nextMaintenance: '2026-06-01',
      totalKilometers: 100,
      rating: 4.5
    };

    const allTrips: Trip[] = Array.from({ length: HISTORY_PAGE_TRIPS }, (_unused, index) => makeTrip(`trip-${index + 1}`));

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);

    tripService = jasmine.createSpyObj<TripService>('TripService', ['loadTrips']);
    tripService.loadTrips.and.returnValue(of(allTrips));

    vehicleService = jasmine.createSpyObj<VehicleService>('VehicleService', ['loadVehicles']);
    vehicleService.loadVehicles.and.returnValue(of([vehicle]));

    await TestBed.configureTestingModule({
      imports: [
        TripHistory,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: TripService, useValue: tripService },
        { provide: VehicleService, useValue: vehicleService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to trip details with the trip id in router state', () => {
    const tripDisplay = {
      route: 'Plaza Mayor - Jockey Plaza',
      date: '15 ene, 10:30',
      vehicle: 'Xiaomi M365',
      duration: '30 min',
      distance: '5 km',
      id: 'trip-1',
      image: 'assets/vehicles/vehicle-1.jpg'
    };

    component.viewDetails(tripDisplay);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/trip/details'], { state: { tripId: 'trip-1' } });
  });

  it('opens the print dialog for a receipt', () => {
    spyOn(window, 'print');
    const tripDisplay = {
      route: 'Plaza Mayor - Jockey Plaza',
      date: '15 ene, 10:30',
      vehicle: 'Xiaomi M365',
      duration: '30 min',
      distance: '5 km',
      id: 'trip-1',
      image: 'assets/vehicles/vehicle-1.jpg'
    };

    component.printReceipt(tripDisplay);

    expect(window.print).toHaveBeenCalled();
  });

  it('shows only the first page of trips and appends the next page on seeMore', () => {
    expect(component.trips.length).toBe(5);
    expect(tripService.loadTrips).toHaveBeenCalledTimes(1);

    component.seeMore();

    expect(component.trips.length).toBe(7);
    expect(tripService.loadTrips).toHaveBeenCalledTimes(1);
  });

  it('does not grow the list once all trips are shown', () => {
    component.seeMore();
    expect(component.trips.length).toBe(7);

    component.seeMore();

    expect(component.trips.length).toBe(7);
    expect(tripService.loadTrips).toHaveBeenCalledTimes(1);
  });
});
