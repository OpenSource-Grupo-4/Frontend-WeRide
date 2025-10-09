import { Component } from '@angular/core';
import {PlanList} from '../plan-list/plan-list';

@Component({
  selector: 'app-plan-layout',
  imports: [
    PlanList
  ],
  templateUrl: './plan-layout.html',
  styleUrl: './plan-layout.css'
})
export class PlanLayout {

}
