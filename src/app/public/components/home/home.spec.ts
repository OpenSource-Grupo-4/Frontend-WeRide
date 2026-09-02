import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { signal } from '@angular/core';

import { Home } from './home';
import { AuthStore } from '../../../auth/application/auth.store';
import { ActiveBookingService } from '../../../booking/application/active-booking.service';

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authStore: { session: ReturnType<typeof signal> };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authStore = {
      session: signal({ isAuthenticated: false })
    };

    await TestBed.configureTestingModule({
      imports: [
        Home,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
        { provide: AuthStore, useValue: authStore },
        { provide: ActiveBookingService, useValue: { getActiveBooking: () => null } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a login-required message instead of navigating to garage when guest', () => {
    component.navigateToGarage();
    expect(component.guestBookingMessage()).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('navigates to garage when authenticated', () => {
    authStore.session.set({ isAuthenticated: true });
    component.navigateToGarage();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/garage']);
  });

  it('shows a login-required message instead of navigating to bookings when guest', () => {
    component.navigateToBookings();
    expect(component.guestBookingMessage()).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('navigates to bookings when authenticated', () => {
    authStore.session.set({ isAuthenticated: true });
    component.navigateToBookings();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/booking']);
  });

  it('shows a login-required message instead of navigating to vehicle status when guest', () => {
    component.navigateToVehicleStatus();
    expect(component.guestBookingMessage()).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('navigates to vehicle status when authenticated', () => {
    authStore.session.set({ isAuthenticated: true });
    component.navigateToVehicleStatus();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/vehicle-status']);
  });

  it('shows a login-required message instead of navigating to schedule unlock when guest', () => {
    component.onScheduleUnlock();
    expect(component.guestBookingMessage()).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('navigates to schedule unlock when authenticated', () => {
    authStore.session.set({ isAuthenticated: true });
    component.onScheduleUnlock();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/schedule-unlock']);
  });

  it('shows a login-required message instead of navigating to a feature when guest', () => {
    component.onFeatureClick({ route: '/plan' });
    expect(component.guestBookingMessage()).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the feature route when authenticated', () => {
    authStore.session.set({ isAuthenticated: true });
    component.onFeatureClick({ route: '/plan' });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/plan']);
  });

  it('dismisses the login-required message', () => {
    component.navigateToGarage();
    expect(component.guestBookingMessage()).toBeTrue();

    component.dismissGuestMessage();
    expect(component.guestBookingMessage()).toBeFalse();
  });

  it('navigates to login when the user chooses to log in', () => {
    component.goToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
