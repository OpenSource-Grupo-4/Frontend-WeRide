import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { PlanDetail } from './plan-detail';
import { PlanStore } from '../../../application/plan.store';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('PlanDetail', () => {
  let component: PlanDetail;
  let fixture: ComponentFixture<PlanDetail>;

  beforeEach(async () => {
    // PlanStore is a root service pulling PlansApiEndpoint (HttpClient); the
    // component only reads selectedPlan$/loading$ and calls loadPlanById.
    const planStore = {
      selectedPlan$: of(null),
      loading$: of(false),
      loadPlanById: jasmine.createSpy('loadPlanById')
    };

    await TestBed.configureTestingModule({
      imports: [
        PlanDetail,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'id' ? 'plan-1' : null) } }
          }
        },
        { provide: PlanStore, useValue: planStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
