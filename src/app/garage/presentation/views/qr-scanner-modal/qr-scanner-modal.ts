import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Vehicle } from '../../../domain/model/vehicle.model';

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
  constructor(
    public dialogRef: MatDialogRef<QrScannerModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) public vehicle?: Vehicle
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onOK(): void {
    this.dialogRef.close({ scanned: true });
  }
}

