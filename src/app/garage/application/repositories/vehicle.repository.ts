import { Vehicle } from '../../domain/models/vehicle.model';

export abstract class VehicleRepository {
  abstract findAll(): Promise<Vehicle[]>;
}
