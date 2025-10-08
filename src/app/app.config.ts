import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Repositorio y casos de uso
import { VehicleRepository } from './garage/application/repositories/vehicle.repository';
import { VehicleRepositoryImpl } from './garage/infrastructure/repositories/vehicle.repository.impl';
import { GetVehiclesUseCase } from './garage/application/use-cases/get-vehicles.usecase';
import { FilterVehiclesUseCase } from './garage/application/use-cases/filter-vehicles.usecase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: VehicleRepository, useClass: VehicleRepositoryImpl },
    GetVehiclesUseCase,
    FilterVehiclesUseCase
  ]
};
