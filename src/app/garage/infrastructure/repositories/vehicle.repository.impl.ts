import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleRepository } from '../../application/repositories/vehicle.repository';
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { VehicleApiService } from '../http/vehicle-api.service';
import { VehicleMapper } from '../mappers/vehicle.mapper';

@Injectable({
  providedIn: 'root'
})
export class VehicleRepositoryImpl implements VehicleRepository {
  constructor(private vehicleApiService: VehicleApiService) {}

  async findAll(): Promise<Vehicle[]> {
    try {
      const apiResponse = await this.vehicleApiService.getVehiclesAsync();
      return VehicleMapper.toDomainList(apiResponse);
    } catch (error) {
      console.error('Error fetching vehicles from API:', error);
      throw new Error('No se pudieron cargar los vehículos desde la API');
    }
  }

  async create(vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle> {
    try {
      const body = VehicleMapper.toApiRequest(vehicle);
      const apiResponse = await this.vehicleApiService.createVehicle(body);
      return VehicleMapper.toDomain(apiResponse);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw new Error(this.mapError(error, 'No se pudo crear el vehículo'));
    }
  }

  async update(id: string, vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle> {
    try {
      const body = VehicleMapper.toApiRequest(vehicle);
      const apiResponse = await this.vehicleApiService.updateVehicle(id, body);
      return VehicleMapper.toDomain(apiResponse);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw new Error(this.mapError(error, 'No se pudo actualizar el vehículo'));
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.vehicleApiService.deleteVehicle(id);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw new Error(this.mapError(error, 'No se pudo eliminar el vehículo'));
    }
  }

  private mapError(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    const err = error;
    if (err.status === 401) return 'Sesión inválida, iniciá sesión de nuevo';
    if (err.status === 404) return 'Vehículo no encontrado';
    if (err.status === 409) return typeof err.error === 'string' && err.error ? err.error : 'El vehículo ya existe';
    if (typeof err.error === 'string' && err.error) return err.error;
    return 'Error de conexión con el servidor';
  }
}
