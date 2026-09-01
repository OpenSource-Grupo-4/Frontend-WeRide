import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PlanStore } from './plan.store';
import { PlansApiEndpoint } from '../infrastructure/plans-api-endpoint';

describe('PlanStore', () => {
  it('expone el error y lo limpia al reintentar', () => {
    const api = jasmine.createSpyObj<PlansApiEndpoint>('PlansApiEndpoint', ['getAll']);
    api.getAll.and.returnValues(throwError(() => new Error('network')), of([]));

    TestBed.configureTestingModule({
      providers: [PlanStore, { provide: PlansApiEndpoint, useValue: api }]
    });

    const store = TestBed.inject(PlanStore);
    let hasError = false;
    store.error$.subscribe(value => hasError = value);

    store.loadPlans();
    expect(hasError).toBeTrue();

    store.loadPlans();
    expect(hasError).toBeFalse();
  });
});
