import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GarageFilter } from '../garage-filter/garage-filter';
import { VehicleCard } from '../vehicle-card/vehicle-card';
import { VehicleDetailsModal } from '../vehicle-details-modal/vehicle-details-modal';
import { QrScannerModal } from '../qr-scanner-modal/qr-scanner-modal';
import { ManualUnlockModal } from '../manual-unlock-modal/manual-unlock-modal';
import { ReportProblemModal } from '../report-problem-modal/report-problem-modal';
import { MatButton } from '@angular/material/button';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { VehicleFilter } from '../../../domain/model/vehicle-filter.model';
import { GetVehiclesUseCase } from '../../../application/use-cases/get-vehicles.usecase';
import { FilterVehiclesUseCase } from '../../../application/use-cases/filter-vehicles.usecase';
import { ToggleFavoriteUseCase } from '../../../application/use-cases/toggle-favorite.usecase';

@Component({
  selector: 'app-garage-layout',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    GarageFilter,
    VehicleCard,
    MatButton,
  ],
  templateUrl: './garage-layout.html',
  styleUrl: './garage-layout.css'
})
export class GarageLayout implements OnInit {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private dialog: MatDialog,
    private getVehiclesUseCase: GetVehiclesUseCase,
    private filterVehiclesUseCase: FilterVehiclesUseCase,
    private toggleFavoriteUseCase: ToggleFavoriteUseCase,
    private translate: TranslateService
  ) {}

  async ngOnInit() {
    await this.loadVehicles();
  }

  async loadVehicles() {
    this.isLoading = true;
    this.error = null;
    try {
      this.vehicles = await this.getVehiclesUseCase.execute();
      this.filteredVehicles = this.vehicles;
    } catch (error) {
      this.error = this.translate.instant('garage.error');
      console.error('Error loading vehicles:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async applyFilter(filter: VehicleFilter) {
    this.isLoading = true;
    try {
      this.filteredVehicles = await this.filterVehiclesUseCase.execute(filter);
    } catch (error) {
      this.error = this.translate.instant('garage.filterError');
      console.error('Error applying filters:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async toggleFavorite(vehicleId: string) {
    await this.toggleFavoriteUseCase.execute(vehicleId);
    await this.loadVehicles();
  }

  openVehicleDetails(vehicle: Vehicle) {
    this.dialog.open(VehicleDetailsModal, {
      data: vehicle,
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'vehicle-details-dialog',
      autoFocus: false,
      restoreFocus: false
    });
  }

  openQrScannerModal(vehicle?: Vehicle) {
    this.dialog.open(QrScannerModal, {
      data: vehicle,
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'qr-scanner-dialog',
      autoFocus: false
    });
  }

  openManualUnlockModal(vehicle: Vehicle) {
    this.dialog.open(ManualUnlockModal, {
      data: vehicle,
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'manual-unlock-dialog',
      autoFocus: false
    });
  }

  openReportProblemModal(vehicle: Vehicle) {
    this.dialog.open(ReportProblemModal, {
      data: vehicle,
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'report-problem-dialog',
      autoFocus: false
    });
  }
}
