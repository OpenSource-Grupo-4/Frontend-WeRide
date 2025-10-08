import { Component, inject, OnInit } from '@angular/core';
import { Vehicle } from '../../domain/models/vehicle.model';
import { VehicleFilter } from '../../domain/models/vehicle-filter.model';
import { VehicleCardComponent } from '../vehicle-card/vehicle-card.component';
import { GarageFilterComponent } from '../garage-filter/garage-filter.component';
// Casos de uso
import { GetVehiclesUseCase } from '../../application/use-cases/get-vehicles.usecase';
import { FilterVehiclesUseCase } from '../../application/use-cases/filter-vehicles.usecase';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {VehicleRepositoryImpl} from '../../infrastructure/repositories/vehicle.repository.impl';
import {VehicleRepository} from '../../application/repositories/vehicle.repository';

@Component({
  selector: 'app-garage',
  standalone: true,
  imports: [VehicleCardComponent, GarageFilterComponent ,FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './garage.component.html',
  styleUrls: ['./garage.component.css'],
  providers: [
    { provide: VehicleRepository, useClass: VehicleRepositoryImpl },
    GetVehiclesUseCase,
    FilterVehiclesUseCase]
})
export class GarageComponent implements OnInit {
  private getVehiclesUC = inject(GetVehiclesUseCase);
  private filterVehiclesUC = inject(FilterVehiclesUseCase);

  vehicles: Vehicle[] = [];
  loading = false;

  async ngOnInit() {
    this.loading = true;
    this.vehicles = await this.getVehiclesUC.execute();
    this.loading = false;
  }

  async applyFilter(filter: VehicleFilter) {
    this.loading = true;
    this.vehicles = await this.filterVehiclesUC.execute(filter);
    this.loading = false;
  }

}
