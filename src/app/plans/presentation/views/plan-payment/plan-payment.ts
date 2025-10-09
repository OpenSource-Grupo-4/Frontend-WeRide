import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Plan } from '../../../domain/model/plan.entity';
import { PlanStore } from '../../../application/plan.store';

@Component({
  selector: 'app-plan-payment',
  imports: [CommonModule],
  templateUrl: './plan-payment.html',
  styleUrl: './plan-payment.css'
})
export class PlanPayment implements OnInit {
  plan$: Observable<Plan | null>;
  loading$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private planStore: PlanStore
  ) {
    this.plan$ = this.planStore.selectedPlan$;
    this.loading$ = this.planStore.loading$;
  }

  ngOnInit(): void {
    const planId = this.route.snapshot.paramMap.get('id');
    if (planId) {
      this.planStore.loadPlanById(planId);
    }
  }

  getFormattedPrice(plan: Plan): string {
    return `${plan.currency === 'USD' ? '$' : plan.currency}${plan.price.toFixed(2)}`;
  }
}
