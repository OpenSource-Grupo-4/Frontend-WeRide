import {Component, EventEmitter, Output} from '@angular/core';
import {MatFormField} from '@angular/material/form-field';
import {MatLabel} from '@angular/material/form-field-module';
import {MatInput} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatSelect} from '@angular/material/select-module';
import {MatOption} from '@angular/material/option';
import {VehicleFilter} from '../../../domain/model/vehicle-filter.model';

@Component({
  selector: 'app-garage-filter',
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatSelect,
    MatOption
  ],
  templateUrl: './garage-filter.html',
  styleUrl: './garage-filter.css'
})
export class GarageFilter {
  minPrice: number | null = null;
  maxPrice: number | null = null;
  available: boolean | null = null;
  minRating: number | null = null;
  brand: string | null = null;

  @Output() filterChange = new EventEmitter<VehicleFilter>();

  applyFilters() {
    this.filterChange.emit({
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
      available: this.available ?? undefined,
      minRating: this.minRating ?? undefined,
      brand: this.brand ?? undefined
    });
  }
}
