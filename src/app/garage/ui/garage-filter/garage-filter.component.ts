import { Component, EventEmitter, Output } from '@angular/core';
import { VehicleFilter } from '../../domain/models/vehicle-filter.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-garage-filter',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './garage-filter.component.html',
  styleUrls: ['./garage-filter.component.css']
})
export class GarageFilterComponent {
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
