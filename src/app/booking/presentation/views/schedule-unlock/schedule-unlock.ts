import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Vehicle } from '../../../../garage/domain/model/vehicle.model';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { toDomainBooking } from '../../../infraestructure/booking-assembler';
import { ActiveBookingService } from '../../../application/active-booking.service';
import { BookingStore } from '../../../application/booking.store';

@Component({
  selector: 'app-schedule-unlock',
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, TranslateModule],
  templateUrl: './schedule-unlock.html',
  styleUrl: './schedule-unlock.css'
})
export class ScheduleUnlockComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private bookingsApi = inject(BookingsApiEndpoint);
  private activeBookingService = inject(ActiveBookingService);
  private bookingStore = inject(BookingStore);

  searchTerm: string = '';
  selectedVehicle: Vehicle | null = null;
  selectedDate: string = '';
  unlockTime: string = '';
  duration: number = 1;
  smsReminder: boolean = false;
  emailConfirmation: boolean = false;
  pushNotification: boolean = false;
  isImmediate: boolean = false;

  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];

  ngOnInit() {
    // Get vehicle from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    if (state?.vehicle) {
      this.selectedVehicle = state.vehicle;
      this.searchTerm = `${state.vehicle.brand} ${state.vehicle.model}`;
    }

    // Check if immediate booking
    if (state?.immediate) {
      this.isImmediate = true;
      this.setImmediateBooking();
    } else {
      this.setDefaultDateTime();
    }
  }

  setImmediateBooking() {
    const now = new Date();
    this.selectedDate = now.toISOString().split('T')[0];
    this.unlockTime = now.toTimeString().substring(0, 5);
  }

  setDefaultDateTime() {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  filterVehicles() {
    if (!this.searchTerm.trim()) {
      this.filteredVehicles = [...this.vehicles];
    } else {
      this.filteredVehicles = this.vehicles.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        vehicle.location.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  selectVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    this.searchTerm = `${vehicle.brand} ${vehicle.model}`;
    this.filteredVehicles = [];
  }

  formatDateTime(): string {
    if (!this.selectedDate || !this.unlockTime) {
      return 'Select date and time';
    }
    
    const date = new Date(this.selectedDate);
    const time = this.unlockTime;
    
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hour12}:${minutes} ${ampm}`;
    
    return `${formattedDate} at ${formattedTime}`;
  }

  calculateTotal(): string {
    if (!this.selectedVehicle) return '0.00';
    // Convert hours to minutes for calculation
    const totalMinutes = this.duration * 60;
    return (this.selectedVehicle.pricePerMinute * totalMinutes).toFixed(2);
  }

  scheduleUnlock() {
    if (!this.selectedVehicle || !this.selectedDate || !this.unlockTime) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    // Combine date and time into startDate
    const [hours, minutes] = this.unlockTime.split(':');
    const startDate = new Date(this.selectedDate);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Calculate endDate based on duration
    const endDate = new Date(startDate.getTime() + this.duration * 60 * 60 * 1000);

    // Get current user ID (replace with actual user service)
    const userId = '1'; // TODO: Get from AuthService

    // Create booking data with explicit status type
    const status: 'pending' | 'confirmed' | 'completed' | 'cancelled' = this.isImmediate ? 'confirmed' : 'pending';

    const bookingData = {
      userId: userId,
      vehicleId: this.selectedVehicle.id,
      startLocationId: '1', // TODO: Get current location
      endLocationId: '1', // TODO: Will be updated on trip end
      reservedAt: new Date().toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      actualStartDate: this.isImmediate ? new Date().toISOString() : null,
      actualEndDate: null,
      status: status,
      totalCost: parseFloat(this.calculateTotal()),
      discount: 0,
      finalCost: parseFloat(this.calculateTotal()),
      paymentMethod: 'card' as const,
      paymentStatus: 'pending' as const,
      distance: null,
      duration: this.duration * 60,
      averageSpeed: null,
      rating: null,
      issues: []
    };

    // Create booking via API
    this.bookingsApi.create(bookingData).subscribe({
      next: (response) => {
        const booking = toDomainBooking(response);

        // Save to active booking service and store
        this.activeBookingService.setActiveBooking(booking);
        this.bookingStore.addBooking(booking);

        // Show success message
        const message = this.isImmediate 
          ? 'Reserva confirmada. ¡Disfruta tu viaje!'
          : 'Reserva programada exitosamente';
        
        this.snackBar.open(message, 'Ver', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        }).onAction().subscribe(() => {
          this.router.navigate(['/trip/details']);
        });

        // Navigate to trip details after delay
        setTimeout(() => {
          this.router.navigate(['/trip/details']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        this.snackBar.open('Error al crear la reserva. Intenta de nuevo.', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  saveDraft() {
    console.log('Saving draft...');
    // Here you would save the current form state as a draft
    this.snackBar.open('Borrador guardado', 'Cerrar', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
