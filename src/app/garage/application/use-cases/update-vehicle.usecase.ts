import { Injectable } from '@angular/core';
import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleRepository } from '../repositories/vehicle.repository';

@Injectable({ providedIn: 'root' })
export class UpdateVehicleUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  execute(id: string, vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle> {
    return this.vehicleRepository.update(id, vehicle);
  }
}
