import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { PlanList } from './plan-list';
import { PlanStore } from '../../../application/plan.store';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('PlanList', () => {
  let component: PlanList;
  let fixture: ComponentFixture<PlanList>;

  beforeEach(async () => {
    // PlanStore is a root service pulling PlansApiEndpoint (HttpClient); the
    // component only consumes its observable streams + loadPlans/selectPlan,
    // so stub that surface (mirrors plan-payment.spec.ts).
    const planStore = {
      plans$: of([]),
      selectedPlan$: of(null),
      loading$: of(false),
      error$: of(false),
      loadPlans: jasmine.createSpy('loadPlans'),
      selectPlan: jasmine.createSpy('selectPlan')
    };

    await TestBed.configureTestingModule({
      imports: [
        PlanList,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideRouter([]),
        { provide: PlanStore, useValue: planStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
