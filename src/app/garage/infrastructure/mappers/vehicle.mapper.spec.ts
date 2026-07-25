import { VehicleMapper } from './vehicle.mapper';
import { Vehicle } from '../../domain/model/vehicle.model';

describe('VehicleMapper.toApiRequest', () => {
  it('mapea un Vehicle (sin id ni favorite) al shape que espera el backend', () => {
    const vehicle: Omit<Vehicle, 'id' | 'favorite'> = {
      brand: 'Xiaomi', model: 'Pro 2', year: 2024, battery: 100, maxSpeed: 25,
      range: 40, weight: 14, color: 'negro', licensePlate: 'ABC-123',
      location: 'Miraflores', status: 'available', type: 'electric_scooter',
      companyId: 'weride', pricePerMinute: 0.5, image: 'scooter.png',
      features: ['gps'], maintenanceStatus: 'ok', lastMaintenance: '2026-01-01',
      nextMaintenance: '2026-06-01', totalKilometers: 0, rating: 5
    };

    const request = VehicleMapper.toApiRequest(vehicle);

    expect(request).toEqual({
      brand: 'Xiaomi', model: 'Pro 2', year: 2024, battery: 100, maxSpeed: 25,
      range: 40, weight: 14, color: 'negro', licensePlate: 'ABC-123',
      location: 'Miraflores', status: 'available', type: 'electric_scooter',
      companyId: 'weride', pricePerMinute: 0.5, image: 'scooter.png',
      features: ['gps'], maintenanceStatus: 'ok', lastMaintenance: '2026-01-01',
      nextMaintenance: '2026-06-01', totalKilometers: 0, rating: 5
    });
    expect((request as any).id).toBeUndefined();
    expect((request as any).favorite).toBeUndefined();
  });
});
