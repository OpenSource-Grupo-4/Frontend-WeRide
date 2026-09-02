import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { signal } from '@angular/core';

import { UserLayout } from './user-layout';
import { UserStats } from '../user-stats/user-stats';
import { UserSettings } from '../user-settings/user-settings';
import { UserWalletCard } from '../user-wallet-card/user-wallet-card';
import { UserHistoryCard } from '../user-history-card/user-history-card';
import { UserSecurityCard } from '../user-security-card/user-security-card';
import { UserHelpCard } from '../user-help-card/user-help-card';
import { UserSettingsCard } from '../user-settings-card/user-settings-card';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';
import { ProfileStore } from '../../../../profile/application/profile.store';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
import { AuthStore } from '../../../../auth/application/auth.store';
import { TripsApiEndpoint } from '../../../../trip/infrastructure/trips-api-endpoint';
import { BookingsApiEndpoint } from '../../../../booking/infraestructure/bookings-api-endpoint';
import { TravelHistoryApiEndpoint } from '../../../../trip/infrastructure/travel-history-api-endpoint';
import { UserPaymentsService } from '../../../infrastructure/user-payments.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('UserLayout', () => {
  let component: UserLayout;
  let fixture: ComponentFixture<UserLayout>;

  beforeEach(async () => {
    // UserLayout renders UserStats/UserSettings + the section cards; each child
    // pulls CurrentUserViewService, endpoint services and UserPaymentsService.
    const currentUserView = jasmine.createSpyObj<CurrentUserViewService>('CurrentUserViewService', [
      'getCurrentUser$'
    ]);
    currentUserView.getCurrentUser$.and.returnValue(of(null));

    // Root signalStores are provided through their signal surfaces.
    const authStore = {
      currentUser: signal(null),
      session: signal({ isAuthenticated: false })
    };
    const profileStore = {
      profile: signal(null),
      isLoading: signal(false),
      error: signal(null),
      getProfile: jasmine.createSpy('getProfile'),
      createProfile: jasmine.createSpy('createProfile')
    };

    const tripsApi = jasmine.createSpyObj<TripsApiEndpoint>('TripsApiEndpoint', ['getMine']);
    tripsApi.getMine.and.returnValue(of([]));
    const bookingsApi = jasmine.createSpyObj<BookingsApiEndpoint>('BookingsApiEndpoint', ['getCompletedByUser']);
    bookingsApi.getCompletedByUser.and.returnValue(of([]));
    const travelHistoryApi = jasmine.createSpyObj<TravelHistoryApiEndpoint>('TravelHistoryApiEndpoint', ['getByUserId']);
    travelHistoryApi.getByUserId.and.returnValue(of([]));
    const userPayments = jasmine.createSpyObj<UserPaymentsService>('UserPaymentsService', [
      'getRecentPayments', 'getTotalSpent'
    ]);
    userPayments.getRecentPayments.and.returnValue(of([]));
    userPayments.getTotalSpent.and.returnValue(of(0));

    await TestBed.configureTestingModule({
      imports: [
        UserLayout,
        UserStats,
        UserSettings,
        UserWalletCard,
        UserHistoryCard,
        UserSecurityCard,
        UserHelpCard,
        UserSettingsCard,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        UserSettingsStateService,
        { provide: ProfileStore, useValue: profileStore },
        { provide: CurrentUserViewService, useValue: currentUserView },
        { provide: AuthStore, useValue: authStore },
        { provide: TripsApiEndpoint, useValue: tripsApi },
        { provide: BookingsApiEndpoint, useValue: bookingsApi },
        { provide: TravelHistoryApiEndpoint, useValue: travelHistoryApi },
        { provide: UserPaymentsService, useValue: userPayments }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
