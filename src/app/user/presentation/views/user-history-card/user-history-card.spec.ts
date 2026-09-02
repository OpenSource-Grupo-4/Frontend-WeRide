import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { UserHistoryCard } from './user-history-card';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
import { TripsApiEndpoint } from '../../../../trip/infrastructure/trips-api-endpoint';
import { BookingsApiEndpoint } from '../../../../booking/infraestructure/bookings-api-endpoint';
import { TravelHistoryApiEndpoint } from '../../../../trip/infrastructure/travel-history-api-endpoint';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('UserHistoryCard', () => {
  let component: UserHistoryCard;
  let fixture: ComponentFixture<UserHistoryCard>;

  beforeEach(async () => {
    const currentUserView = jasmine.createSpyObj<CurrentUserViewService>('CurrentUserViewService', [
      'getCurrentUser$'
    ]);
    currentUserView.getCurrentUser$.and.returnValue(of(null));
    const tripsApi = jasmine.createSpyObj<TripsApiEndpoint>('TripsApiEndpoint', ['getMine']);
    tripsApi.getMine.and.returnValue(of([]));
    const bookingsApi = jasmine.createSpyObj<BookingsApiEndpoint>('BookingsApiEndpoint', ['getCompletedByUser']);
    bookingsApi.getCompletedByUser.and.returnValue(of([]));
    const travelHistoryApi = jasmine.createSpyObj<TravelHistoryApiEndpoint>('TravelHistoryApiEndpoint', ['getByUserId']);
    travelHistoryApi.getByUserId.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        UserHistoryCard,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        UserSettingsStateService,
        { provide: CurrentUserViewService, useValue: currentUserView },
        { provide: TripsApiEndpoint, useValue: tripsApi },
        { provide: BookingsApiEndpoint, useValue: bookingsApi },
        { provide: TravelHistoryApiEndpoint, useValue: travelHistoryApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserHistoryCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
