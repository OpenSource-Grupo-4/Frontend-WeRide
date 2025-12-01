import { Component, Inject, Optional, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { Booking } from '../../../../booking/domain/model/booking.entity';
import { UnlockRequest } from '../../../../booking/domain/model/unlockRequest.entity';
import { UnlockRequestsApiEndpoint } from '../../../../booking/infraestructure/unlockRequests-api-endpoint';
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
  private unlockRequestsApi = inject(UnlockRequestsApiEndpoint);
  private snackBar = inject(MatSnackBar);

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

  onClose(): void {
    this.dialogRef.close();
  }

  async onScan(): Promise<void> {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;

    try {

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (this.unlockRequest) {

        const updatedUnlockRequest = {
          ...this.unlockRequest,
          status: 'unlocked' as const,
          actualUnlockTime: new Date(),
          attempts: this.unlockRequest.attempts + 1
        };

        await firstValueFrom(
          this.unlockRequestsApi.update(this.unlockRequest.id, {
            status: 'unlocked',
            actualUnlockTime: new Date().toISOString(),
            attempts: updatedUnlockRequest.attempts
          })
        );

        this.dialogRef.close({
          unlocked: true,
          unlockRequest: updatedUnlockRequest,
          scanned: true
        });
      } else {
        this.dialogRef.close({ scanned: true });
      }
    } catch (error) {
      console.error('Error scanning QR:', error);
      this.snackBar.open('Error al escanear el código QR. Intenta de nuevo.', 'Cerrar', {
        duration: 4000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      this.isScanning = false;
    }
  }

  onOK(): void {
    if (this.unlockRequest) {
      this.onScan();
    } else {
      this.dialogRef.close({ scanned: true });
    }
  }
}

