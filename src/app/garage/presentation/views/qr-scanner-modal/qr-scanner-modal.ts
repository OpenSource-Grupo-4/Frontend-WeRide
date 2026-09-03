import { Component, Inject, Optional, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { Booking } from '../../../../booking/domain/model/booking.entity';
import { UnlockRequest } from '../../../../booking/domain/model/unlockRequest.entity';
import { UnlockRequestsApiEndpoint } from '../../../../booking/infraestructure/unlockRequests-api-endpoint';
import { BookingStore } from '../../../../booking/application/booking.store';
import { TripStore } from '../../../../trip/application/trip.store';
import { firstValueFrom } from 'rxjs';

export interface QrScannerModalData {
  vehicle?: Vehicle;
  booking?: Booking;
  unlockRequest?: UnlockRequest;
}

@Component({
  selector: 'app-qr-scanner-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './qr-scanner-modal.html',
  styleUrl: './qr-scanner-modal.css'
})
export class QrScannerModal {
  isScanning = false;
  scannedCode = '';
  errorMessage = '';
  private unlockRequestsApi = inject(UnlockRequestsApiEndpoint);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private bookingStore = inject(BookingStore);
  private tripStore = inject(TripStore);

  constructor(
    public dialogRef: MatDialogRef<QrScannerModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: QrScannerModalData
  ) {}

  get vehicle(): Vehicle | undefined {
    return this.data?.vehicle;
  }

  get booking(): Booking | undefined {
    return this.data?.booking;
  }

  get unlockRequest(): UnlockRequest | undefined {
    return this.data?.unlockRequest;
  }

  async onScan(): Promise<void> {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;
    this.errorMessage = '';

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const qrCode = this.scannedCode || 'QR_CODE_MOCK';
      const unlockResult = await this.bookingStore.unlockVehicleByQR(qrCode);

      if (unlockResult.success) {
        if (this.unlockRequest) {
          await firstValueFrom(
            this.unlockRequestsApi.update(this.unlockRequest.id, {
              status: 'unlocked',
              actualUnlockTime: new Date().toISOString(),
              attempts: this.unlockRequest.attempts + 1
            })
          );
        }

        this.snackBar.open(
          this.translate.instant('garage.manualUnlock.unlockedSuccess'),
          this.translate.instant('common.close'),
          { duration: 3000, panelClass: ['success-snackbar'] }
        );

        this.dialogRef.close({ success: true });

        this.router.navigate(['/trip'], {
          queryParams: { activeTrip: true }
        });
      } else {
        throw new Error(unlockResult.error || this.translate.instant('garage.qrScanner.unlockError'));
      }
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : this.translate.instant('garage.qrScanner.scanError');

      this.snackBar.open(
        this.errorMessage,
        this.translate.instant('common.retry'),
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      this.isScanning = false;
    }
  }

  onClose(): void {
    this.dialogRef.close({ cancelled: true });
  }

  onOK(): void {
    if (this.unlockRequest) {
      this.onScan();
    } else {
      this.dialogRef.close({ scanned: true });
    }
  }
}

