import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { UserWalletCard } from './user-wallet-card';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
import { UserPaymentsService } from '../../../infrastructure/user-payments.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('UserWalletCard', () => {
  let component: UserWalletCard;
  let fixture: ComponentFixture<UserWalletCard>;

  beforeEach(async () => {
    const currentUserView = jasmine.createSpyObj<CurrentUserViewService>('CurrentUserViewService', [
      'getCurrentUser$'
    ]);
    currentUserView.getCurrentUser$.and.returnValue(of(null));
    const userPayments = jasmine.createSpyObj<UserPaymentsService>('UserPaymentsService', [
      'getRecentPayments', 'getTotalSpent'
    ]);
    userPayments.getRecentPayments.and.returnValue(of([]));
    userPayments.getTotalSpent.and.returnValue(of(0));

    await TestBed.configureTestingModule({
      imports: [
        UserWalletCard,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        UserSettingsStateService,
        { provide: CurrentUserViewService, useValue: currentUserView },
        { provide: UserPaymentsService, useValue: userPayments }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserWalletCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
