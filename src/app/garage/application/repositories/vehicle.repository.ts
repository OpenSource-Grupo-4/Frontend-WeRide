import { Vehicle } from '../../domain/model/vehicle.model';

export abstract class VehicleRepository {
  abstract findAll(): Promise<Vehicle[]>;
  abstract create(vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle>;
  abstract update(id: string, vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle>;
  abstract remove(id: string): Promise<void>;
}
