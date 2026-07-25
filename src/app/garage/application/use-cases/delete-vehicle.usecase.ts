import { Injectable } from '@angular/core';
import { VehicleRepository } from '../repositories/vehicle.repository';

@Injectable({ providedIn: 'root' })
export class DeleteVehicleUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  execute(id: string): Promise<void> {
    return this.vehicleRepository.remove(id);
  }
}
