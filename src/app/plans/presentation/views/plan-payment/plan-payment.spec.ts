import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PlanPayment } from './plan-payment';
import { PlanStore } from '../../../application/plan.store';
import { PaymentsApiEndpoint } from '../../../infrastructure/payments-api-endpoint';
import { Plan } from '../../../domain/model/plan.entity';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

const TEST_PLAN = new Plan(
  'plan-1',
  'Plan Semanal',
  'Plan de prueba',
  49.99,
  'USD',
  0.5,
  'weekly',
  7,
  2,
  30,
  60,
  10,
  ['Beneficio 1'],
  '#7c3aed',
  true,
  true
);

function fillValidForm(component: PlanPayment): void {
  component.cardNumber = '4242 4242 4242 4242';
  component.expiryDate = '12/30';
  component.cvv = '123';
  component.billingAddress = 'Av. Siempre Viva 742';
}

describe('PlanPayment', () => {
  let component: PlanPayment;
  let fixture: ComponentFixture<PlanPayment>;
  let routerSpy: jasmine.SpyObj<Router>;
  let paymentsApi: jasmine.SpyObj<PaymentsApiEndpoint>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    paymentsApi = jasmine.createSpyObj('PaymentsApiEndpoint', ['create']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        PlanPayment,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => (key === 'id' ? 'plan-1' : null) }
            }
          }
        },
        {
          provide: PlanStore,
          useValue: {
            selectedPlan$: of(TEST_PLAN),
            loadPlanById: jasmine.createSpy('loadPlanById')
          }
        },
        { provide: PaymentsApiEndpoint, useValue: paymentsApi },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanPayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the selected plan from the store on init', () => {
    expect(component.selectedPlan).toEqual(TEST_PLAN);
    expect(Math.round(component.total * 100) / 100).toBe(44.99);
  });

  it('posts the payment to the API and navigates to the confirmation route on success', () => {
    paymentsApi.create.and.returnValue(of({ id: 'p1' }));
    fillValidForm(component);

    component.endPayment();

    expect(paymentsApi.create).toHaveBeenCalledWith(jasmine.objectContaining({
      planId: 'plan-1',
      amount: jasmine.any(Number),
      paymentMethod: 'card'
    }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/plan/payment-success']);
  });

  it('does not submit or navigate when the form is invalid', () => {
    component.cardNumber = '';

    component.endPayment();

    expect(paymentsApi.create).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('does not navigate to the confirmation route when the payment API fails and shows an error message', () => {
    spyOn(console, 'error');
    paymentsApi.create.and.returnValue(throwError(() => new Error('payment failed')));
    fillValidForm(component);

    component.endPayment();

    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/plan/payment-success']);
    expect(snackBarSpy.open).toHaveBeenCalled();
  });
});
