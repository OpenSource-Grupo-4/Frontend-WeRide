import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { GarageFilter } from './garage-filter';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('GarageFilter', () => {
  let component: GarageFilter;
  let fixture: ComponentFixture<GarageFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GarageFilter,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      // mat-select / mat-form-field render animations.
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(GarageFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
