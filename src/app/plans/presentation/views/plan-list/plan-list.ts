import { Component, OnInit } from '@angular/core';
import { CommonModule} from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Plan } from '../../../domain/model/plan.entity';
import { PlanStore } from '../../../application/plan.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatButtonModule],
  templateUrl: './plan-list.html',
  styleUrl: './plan-list.css'
})
export class PlanList implements OnInit {
  plans$: Observable<Plan[]>;
  selectedPlan$: Observable<Plan | null>;
  loading$: Observable<boolean>;

  constructor(private planStore: PlanStore) {
    this.plans$ = this.planStore.plans$;
    this.selectedPlan$ = this.planStore.selectedPlan$;
    this.loading$ = this.planStore.loading$;
  }

  ngOnInit(): void {
    this.planStore.loadPlans();
  }

  selectPlan(plan: Plan): void {
    this.planStore.selectPlan(plan);
  }

  getFormattedPrice(plan: Plan): string {
    return `${plan.currency === 'USD' ? '$' : plan.currency}${plan.price.toFixed(2)}`;
  }

  getFormattedDuration(plan: Plan): string {
    return plan.duration === 'monthly' ? 'Mensual' : plan.duration;
  }
}
