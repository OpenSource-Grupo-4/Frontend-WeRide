import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActiveBookingService } from '../../../booking/application/active-booking.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private activeBookingService = inject(ActiveBookingService);

  onScheduleUnlock(): void {
    const activeBooking = this.activeBookingService.getActiveBooking();

    if (activeBooking) {
      this.router.navigate(['/trip/details']);
    } else {
      this.snackBar.open(
        'Reserva un vehículo primero',
        'Cerrar',
        {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['info-snackbar']
        }
      );
      
      setTimeout(() => {
        this.router.navigate(['/garage']);
      }, 500);
    }
  }
}
