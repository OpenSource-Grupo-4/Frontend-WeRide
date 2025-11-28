import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Vehicle } from '../../../domain/model/vehicle.model';

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

  constructor(
    public dialogRef: MatDialogRef<ManualUnlockModal>,
    @Inject(MAT_DIALOG_DATA) public vehicle: Vehicle
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onUnlock(): void {
    if (this.phoneNumber && this.password && this.acceptTerms) {
      this.dialogRef.close({
        phoneNumber: this.phoneNumber,
        password: this.password
      });
    }
  }

  isFormValid(): boolean {
    return !!this.phoneNumber && !!this.password && this.acceptTerms;
  }
}

