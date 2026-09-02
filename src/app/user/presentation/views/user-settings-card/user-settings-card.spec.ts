import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { UserSettingsCard } from './user-settings-card';
import { LanguageSwitcher } from '../../../../public/components/language-switcher/language-switcher';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('UserSettingsCard', () => {
  let component: UserSettingsCard;
  let fixture: ComponentFixture<UserSettingsCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserSettingsCard,
        LanguageSwitcher,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        // Real service is cheap and providedIn root; no external deps.
        UserSettingsStateService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserSettingsCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
