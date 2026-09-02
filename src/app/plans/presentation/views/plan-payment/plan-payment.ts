import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {Plan} from '../../../domain/model/plan.entity';
import {PlanStore} from '../../../application/plan.store';
import {PaymentsApiEndpoint} from '../../../infrastructure/payments-api-endpoint';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-plan-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './plan-payment.html',
  styleUrl: './plan-payment.css'
})
export class PlanPayment implements OnInit, OnDestroy {
  private readonly store = inject(PlanStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentsApi = inject(PaymentsApiEndpoint);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();
  protected readonly length = length;

  selectedPlan$: Observable<Plan | null> = this.store.selectedPlan$;
  selectedPlan: Plan | null = null;

  cardNumber = '';
  expiryDate = '';
  cvv = '';
  saveCard = false;
  billingAddress = '';

  subtotal = 0;
  discount = 0;
  total = 0;
  submitting = false;

  ngOnInit(): void {
    const planId = this.route.snapshot.paramMap.get('id');

    if (planId) {
      this.store.loadPlanById(planId);
    }

    this.selectedPlan$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(plan => {
      if (plan) {
        this.selectedPlan = plan;
        this.calculatePrices();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/plan']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calculatePrices(): void {
    if (this.selectedPlan) {
      this.subtotal = this.selectedPlan.price;
      this.discount = (this.selectedPlan.price * this.selectedPlan.discountPercentage) / 100;
      this.total = this.subtotal - this.discount;
    }
  }

  isCardNumberValid(): boolean {
    return this.cardNumber.replace(/\s/g, '').length === 16;
  }

  onCardNumberInput(event: any): void {
    let value = event.target.value.replace(/\s/g, '');
    value = value.match(/.{1,4}/g)?.join(' ') || '';
    this.cardNumber = value;
  }

  onExpiryDateInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    this.expiryDate = value;
  }

  verifyAddress(): void {
    this.billingAddress = this.billingAddress.trim();
  }

  isFormValid(): boolean {
    return !!(
      this.cardNumber.replace(/\s/g, '').length === 16 &&
      this.expiryDate.length === 5 &&
      this.cvv.length >= 3 &&
      this.billingAddress
    );
  }

  endPayment(): void {
    if (!this.isFormValid() || !this.selectedPlan || this.submitting) {
      return;
    }

    this.submitting = true;

    const payload = {
      planId: this.selectedPlan.id,
      amount: Math.round(this.total * 100) / 100,
      currency: this.selectedPlan.currency,
      paymentMethod: 'card',
      cardLast4: this.cardNumber.replace(/\s/g, '').slice(-4),
      billingAddress: this.billingAddress,
      saveCard: this.saveCard
    };

    this.paymentsApi.create(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/plan/payment-success']);
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error al procesar el pago:', error);
        this.snackBar.open(
          this.translate.instant('plans.payment.error'),
          this.translate.instant('common.close'),
          { duration: 4000 }
        );
      }
    });
  }

}
