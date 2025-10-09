import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Plan } from '../../../domain/model/plan.entity';
import { PlanStore } from '../../../application/plan.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [CommonModule, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatButtonModule],
  templateUrl: './plan-detail.html',
  styleUrl: './plan-detail.css'
})
export class PlanDetail implements OnInit {
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

  getFormattedDuration(plan: Plan): string {
    return plan.duration === 'monthly' ? 'Mensual' : plan.duration;
  }
}
