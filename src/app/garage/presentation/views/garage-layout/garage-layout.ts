import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GarageFilter } from '../garage-filter/garage-filter';
import { VehicleCard } from '../vehicle-card/vehicle-card';
import { MatButton } from '@angular/material/button';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { VehicleFilter } from '../../../domain/model/vehicle-filter.model';
import { GetVehiclesUseCase } from '../../../application/use-cases/get-vehicles.usecase';
import { FilterVehiclesUseCase } from '../../../application/use-cases/filter-vehicles.usecase';
import { ToggleFavoriteUseCase } from '../../../application/use-cases/toggle-favorite.usecase';

@Component({
  selector: 'app-garage-layout',
  standalone: true,
  imports: [
    CommonModule,
    GarageFilter,
    VehicleCard,
    MatButton,
  ],
  templateUrl: './garage-layout.html',
  styleUrl: './garage-layout.css'
})
export class GarageLayout implements OnInit {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private getVehiclesUseCase: GetVehiclesUseCase,
    private filterVehiclesUseCase: FilterVehiclesUseCase,
    private toggleFavoriteUseCase: ToggleFavoriteUseCase
  ) {}

  async ngOnInit() {
    await this.loadVehicles();
  }

  async loadVehicles() {
    this.isLoading = true;
    this.error = null;
    try {
      this.vehicles = await this.getVehiclesUseCase.execute();
      this.filteredVehicles = this.vehicles;
    } catch (error) {
      this.error = 'Error al cargar los vehículos. Por favor, intente nuevamente.';
      console.error('Error loading vehicles:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async applyFilter(filter: VehicleFilter) {
    this.isLoading = true;
    try {
      this.filteredVehicles = await this.filterVehiclesUseCase.execute(filter);
    } catch (error) {
      this.error = 'Error al aplicar filtros.';
      console.error('Error applying filters:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async toggleFavorite(vehicleId: string) {
    await this.toggleFavoriteUseCase.execute(vehicleId);
    await this.loadVehicles();
  }
}
