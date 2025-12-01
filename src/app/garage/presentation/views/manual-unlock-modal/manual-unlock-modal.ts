import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { Booking } from '../../../../booking/domain/model/booking.entity';
import { UnlockRequest } from '../../../../booking/domain/model/unlockRequest.entity';
import { UnlockRequestsApiEndpoint } from '../../../../booking/infraestructure/unlockRequests-api-endpoint';
import { firstValueFrom } from 'rxjs';

export interface ManualUnlockModalData {
  vehicle: Vehicle;
  booking?: Booking;
  unlockRequest?: UnlockRequest;
}

@Component({
  selector: 'app-manual-unlock-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './manual-unlock-modal.html',
  styleUrl: './manual-unlock-modal.css'
})
export class ManualUnlockModal {
  phoneNumber = '';
  password = '';
  acceptTerms = false;
  isUnlocking = false;
  private unlockRequestsApi = inject(UnlockRequestsApiEndpoint);
  private snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<ManualUnlockModal>,
    @Inject(MAT_DIALOG_DATA) public data: ManualUnlockModalData
  ) {}

  get vehicle(): Vehicle {
    return this.data.vehicle;
  }

  get booking(): Booking | undefined {
    return this.data.booking;
  }

  get unlockRequest(): UnlockRequest | undefined {
    return this.data.unlockRequest;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  async onUnlock(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }

    this.isUnlocking = true;

    try {
      // Validar credenciales (simulado - en producción esto sería una llamada al backend)
      // Por ahora, solo verificamos que los campos no estén vacíos
      if (!this.phoneNumber || !this.password) {
        this.snackBar.open('Por favor ingresa tu número de teléfono y contraseña', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.isUnlocking = false;
        return;
      }

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
          phoneNumber: this.phoneNumber
        });
      } else {
        this.dialogRef.close({
          unlocked: true,
          phoneNumber: this.phoneNumber,
          password: this.password
        });
      }
    } catch (error) {
      console.error('Error unlocking vehicle:', error);
      this.snackBar.open('Error al desbloquear el vehículo. Intenta de nuevo.', 'Cerrar', {
        duration: 4000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      this.isUnlocking = false;
    }
  }

  isFormValid(): boolean {
    return !!this.phoneNumber && !!this.password && this.acceptTerms;
  }
}

