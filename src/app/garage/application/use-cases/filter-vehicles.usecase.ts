import { Injectable } from '@angular/core';
import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleFilter } from '../../domain/model/vehicle-filter.model';
import { VehicleRepository } from '../repositories/vehicle.repository';

@Injectable({
  providedIn: 'root'
})
export class FilterVehiclesUseCase {
  constructor(private vehicleRepo: VehicleRepository) {}

  async execute(filter: VehicleFilter): Promise<Vehicle[]> {
    const vehicles = await this.vehicleRepo.findAll();
    return vehicles.filter(v =>
      (!filter.minPrice || v.price >= filter.minPrice) &&
      (!filter.maxPrice || v.price <= filter.maxPrice) &&
      (!filter.minRating || v.rating >= filter.minRating) &&
      (!filter.brand || v.brand === filter.brand) &&
      (filter.available === undefined || v.available === filter.available)
    );
  }
}
