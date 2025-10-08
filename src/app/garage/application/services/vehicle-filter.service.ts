import { Vehicle } from '../models/vehicle.model';
import { VehicleFilter } from '../models/vehicle-filter.model';

export class VehicleFilterService {
  static apply(vehicles: Vehicle[], filter: VehicleFilter): Vehicle[] {
    return vehicles.filter(v => {
      return (!filter.type || v.type === filter.type) &&
        (!filter.minPrice || v.price >= filter.minPrice) &&
        (!filter.maxPrice || v.price <= filter.maxPrice) &&
        (filter.available === undefined || v.available === filter.available) &&
        (!filter.minRating || v.rating >= filter.minRating) &&
        (!filter.brand || v.brand === filter.brand);
    });
  }
}
