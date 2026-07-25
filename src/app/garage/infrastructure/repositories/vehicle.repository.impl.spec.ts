import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { VehicleRepositoryImpl } from './vehicle.repository.impl';
import { VehicleApiService, VehicleApiResponse } from '../http/vehicle-api.service';
import { Vehicle } from '../../domain/model/vehicle.model';

describe('VehicleRepositoryImpl - CRUD real', () => {
  let repository: VehicleRepositoryImpl;
  let apiSpy: jasmine.SpyObj<Pick<VehicleApiService, 'createVehicle' | 'updateVehicle' | 'deleteVehicle'>>;

  const vehicleInput: Omit<Vehicle, 'id' | 'favorite'> = {
    brand: 'Xiaomi', model: 'Pro 2', year: 2024, battery: 100, maxSpeed: 25,
    range: 40, weight: 14, color: 'negro', licensePlate: 'ABC-123',
    location: 'Miraflores', status: 'available', type: 'electric_scooter',
    companyId: 'weride', pricePerMinute: 0.5, image: 'scooter.png',
    features: ['gps'], maintenanceStatus: 'ok', lastMaintenance: '2026-01-01',
    nextMaintenance: '2026-06-01', totalKilometers: 0, rating: 5
  };

  const apiResponse: VehicleApiResponse = { id: '10', ...vehicleInput } as VehicleApiResponse;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('VehicleApiService', ['createVehicle', 'updateVehicle', 'deleteVehicle']);

    TestBed.configureTestingModule({
      providers: [VehicleRepositoryImpl, { provide: VehicleApiService, useValue: apiSpy }]
    });
    repository = TestBed.inject(VehicleRepositoryImpl);
  });

  it('create() llama a createVehicle con el body mapeado y devuelve el Vehicle de dominio', async () => {
    apiSpy.createVehicle.and.returnValue(Promise.resolve(apiResponse));

    const result = await repository.create(vehicleInput);

    expect(apiSpy.createVehicle).toHaveBeenCalledWith(jasmine.objectContaining({ brand: 'Xiaomi', model: 'Pro 2' }));
    expect(result.id).toBe('10');
    expect(result.brand).toBe('Xiaomi');
  });

  it('update() llama a updateVehicle con el id y el body mapeado', async () => {
    apiSpy.updateVehicle.and.returnValue(Promise.resolve(apiResponse));

    const result = await repository.update('10', vehicleInput);

    expect(apiSpy.updateVehicle).toHaveBeenCalledWith('10', jasmine.objectContaining({ brand: 'Xiaomi' }));
    expect(result.id).toBe('10');
  });

  it('remove() llama a deleteVehicle con el id', async () => {
    apiSpy.deleteVehicle.and.returnValue(Promise.resolve());

    await repository.remove('10');

    expect(apiSpy.deleteVehicle).toHaveBeenCalledWith('10');
  });

  it('create() propaga un error legible si la llamada falla', async () => {
    apiSpy.createVehicle.and.returnValue(Promise.reject(new Error('network down')));

    await expectAsync(repository.create(vehicleInput)).toBeRejectedWithError('No se pudo crear el vehículo');
  });

  it('create() mapea un 404 a "Vehículo no encontrado"', async () => {
    const httpError = new HttpErrorResponse({ status: 404, error: null });
    apiSpy.createVehicle.and.returnValue(Promise.reject(httpError));

    await expectAsync(repository.create(vehicleInput)).toBeRejectedWithError('Vehículo no encontrado');
  });

  it('update() mapea un 401 a "Sesión inválida, iniciá sesión de nuevo"', async () => {
    const httpError = new HttpErrorResponse({ status: 401, error: null });
    apiSpy.updateVehicle.and.returnValue(Promise.reject(httpError));

    await expectAsync(repository.update('10', vehicleInput)).toBeRejectedWithError('Sesión inválida, iniciá sesión de nuevo');
  });
});
