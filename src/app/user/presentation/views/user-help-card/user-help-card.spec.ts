import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { UserHelpCard } from './user-help-card';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('UserHelpCard', () => {
  let component: UserHelpCard;
  let fixture: ComponentFixture<UserHelpCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserHelpCard,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        // Real service is cheap and providedIn root; no external deps.
        UserSettingsStateService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserHelpCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
