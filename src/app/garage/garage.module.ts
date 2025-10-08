import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GarageRoutingModule } from './garage-routing.module';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';


import { GarageComponent } from './ui/garage/garage.component';
import { VehicleCardComponent } from './ui/vehicle-card/vehicle-card.component';
import { GarageFilterComponent } from './ui/garage-filter/garage-filter.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    GarageRoutingModule,
    GarageComponent,
    VehicleCardComponent,
    GarageFilterComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ]
})
export class GarageModule {}
