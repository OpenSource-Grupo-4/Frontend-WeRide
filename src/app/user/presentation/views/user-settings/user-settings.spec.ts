import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { UserSettings } from './user-settings';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('UserSettings', () => {
  let component: UserSettings;
  let fixture: ComponentFixture<UserSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserSettings,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        UserSettingsStateService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
