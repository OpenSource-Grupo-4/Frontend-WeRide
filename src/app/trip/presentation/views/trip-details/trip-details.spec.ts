import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, of } from 'rxjs';

import { TripDetails } from './trip-details';
import { TripStore } from '../../../application/trip.store';
import { BookingStore } from '../../../../booking/application/booking.store';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { TripInitializerService } from '../../../application/trip-initializer.service';

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

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);

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
        { provide: TripInitializerService, useValue: tripInitializer }
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
});
