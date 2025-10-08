import { Injectable } from '@angular/core';
import { Vehicle } from '../../domain/models/vehicle.model';
import { VehicleRepository } from '../repositories/vehicle.repository';

@Injectable({
  providedIn: 'root'
})
export class GetVehiclesUseCase {
  constructor(private vehicleRepo: VehicleRepository) {}

  async execute(): Promise<Vehicle[]> {
    return this.vehicleRepo.findAll();
  }
}
