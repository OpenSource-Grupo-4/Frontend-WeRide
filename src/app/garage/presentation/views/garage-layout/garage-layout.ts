import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { BookingConfirmationModal } from '../../../../booking/presentation/views/booking-confirmation-modal/booking-confirmation-modal';
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

  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private activeBookingService = inject(ActiveBookingService);

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

  navigateToScheduleUnlock(vehicle: Vehicle): void {
    const activeBooking = this.activeBookingService.getActiveBooking();

    if (activeBooking) {
      const snackBarRef = this.snackBar.open(
        'Ya tienes una reserva activa',
        'Ver Reserva',
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['info-snackbar']
        }
      );

      snackBarRef.onAction().subscribe(() => {
        this.router.navigate(['/trip/details']);
      });
      return;
    }

    // Open confirmation modal
    const dialogRef = this.dialog.open(BookingConfirmationModal, {
      data: { vehicle },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'booking-confirmation-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const immediate = result.action === 'book_now';
        this.router.navigate(['/schedule-unlock'], {
          state: { vehicle, immediate }
        });
      }
    });
  }
}
