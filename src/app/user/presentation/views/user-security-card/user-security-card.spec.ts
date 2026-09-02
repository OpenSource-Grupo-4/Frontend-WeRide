import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { UserSecurityCard } from './user-security-card';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('UserSecurityCard', () => {
  let component: UserSecurityCard;
  let fixture: ComponentFixture<UserSecurityCard>;

  beforeEach(async () => {
    const currentUserView = jasmine.createSpyObj<CurrentUserViewService>('CurrentUserViewService', [
      'getCurrentUser$'
    ]);
    currentUserView.getCurrentUser$.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        UserSecurityCard,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        UserSettingsStateService,
        { provide: CurrentUserViewService, useValue: currentUserView }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserSecurityCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
