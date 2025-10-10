import { Provider } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { VehicleRepository } from './application/repositories/vehicle.repository';
import { VehicleRepositoryImpl } from './infrastructure/repositories/vehicle.repository.impl';
import { GetVehiclesUseCase } from './application/use-cases/get-vehicles.usecase';
import { FilterVehiclesUseCase } from './application/use-cases/filter-vehicles.usecase';
import { ToggleFavoriteUseCase } from './application/use-cases/toggle-favorite.usecase';
import { VehicleApiService } from './infrastructure/http/vehicle-api.service';

export const GARAGE_PROVIDERS: Provider[] = [
  MatDialog,
  VehicleApiService,
  GetVehiclesUseCase,
  FilterVehiclesUseCase,
  ToggleFavoriteUseCase,
  {
    provide: VehicleRepository,
    useClass: VehicleRepositoryImpl
  }
];
