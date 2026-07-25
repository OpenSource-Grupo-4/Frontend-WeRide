import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleApiResponse, CreateVehicleRequest } from '../http/vehicle-api.service';
import { FavoriteService } from '../../application/services/favorite.service';

export class VehicleMapper {
  static toDomain(apiResponse: VehicleApiResponse): Vehicle {
    return {
      id: apiResponse.id,
      brand: apiResponse.brand,
      model: apiResponse.model,
      year: apiResponse.year,
      battery: apiResponse.battery,
      maxSpeed: apiResponse.maxSpeed,
      range: apiResponse.range,
      weight: apiResponse.weight,
      color: apiResponse.color,
      licensePlate: apiResponse.licensePlate,
      location: apiResponse.location,
      status: apiResponse.status as 'available' | 'reserved' | 'maintenance' | 'in_use',
      type: apiResponse.type as 'electric_scooter' | 'bike' | 'electric_bike',
      companyId: apiResponse.companyId,
      pricePerMinute: apiResponse.pricePerMinute,
      image: apiResponse.image,
      features: apiResponse.features,
      maintenanceStatus: apiResponse.maintenanceStatus,
      lastMaintenance: apiResponse.lastMaintenance,
      nextMaintenance: apiResponse.nextMaintenance,
      totalKilometers: apiResponse.totalKilometers,
      rating: apiResponse.rating,
      favorite: FavoriteService.isFavorite(apiResponse.id)
    };
  }

  static toDomainList(apiResponses: VehicleApiResponse[]): Vehicle[] {
    return apiResponses.map(response => this.toDomain(response));
  }

  static toApiRequest(vehicle: Omit<Vehicle, 'id' | 'favorite'>): CreateVehicleRequest {
    return {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      battery: vehicle.battery,
      maxSpeed: vehicle.maxSpeed,
      range: vehicle.range,
      weight: vehicle.weight,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      location: vehicle.location,
      status: vehicle.status,
      type: vehicle.type,
      companyId: vehicle.companyId,
      pricePerMinute: vehicle.pricePerMinute,
      image: vehicle.image,
      features: vehicle.features ?? [],
      maintenanceStatus: vehicle.maintenanceStatus,
      lastMaintenance: vehicle.lastMaintenance,
      nextMaintenance: vehicle.nextMaintenance,
      totalKilometers: vehicle.totalKilometers,
      rating: vehicle.rating
    };
  }
}

