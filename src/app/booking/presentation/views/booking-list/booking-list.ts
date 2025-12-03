import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infraestructure/vehicles-api-endpoint';
import { LocationsApiEndpoint } from '../../../infraestructure/locations-api-endpoint';
import { BookingStorageService } from '../../../application/booking-storage.service';
import { BookingStore } from '../../../application/booking.store';
import { forkJoin } from 'rxjs';

interface BookingView {
  id: string;
  vehicleName: string;
  startLocationName: string;
  endLocationName: string;
  startDate: Date;
  duration: number | null;
  finalCost: number | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-booking-list',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSnackBarModule, MatDialogModule, RouterModule, TranslateModule],
  templateUrl: './booking-list.html',
  styleUrl: './booking-list.css'
})
export class BookingListComponent implements OnInit {
  private bookingsApi = inject(BookingsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  private locationsApi = inject(LocationsApiEndpoint);
  private bookingStorage = inject(BookingStorageService);
  private bookingStore = inject(BookingStore);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  bookings: BookingView[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    
    // Load from localStorage first
    const localBookings = this.bookingStorage.getBookings();
    
    // Also try to load from API
    forkJoin({
      bookings: this.bookingsApi.getAll(),
      vehicles: this.vehiclesApi.getAll(),
      locations: this.locationsApi.getAll()
    }).subscribe({
      next: ({ bookings, vehicles, locations }) => {
        // Merge API bookings with local bookings
        const allBookings = [...localBookings, ...bookings];
        
        // Remove duplicates (prefer local version)
        const uniqueBookings = Array.from(
          new Map(allBookings.map(b => [b.id, b])).values()
        );
        
        this.bookings = uniqueBookings.map(booking => {
          const vehicle = vehicles.find(v => v.id === booking.vehicleId);
          const startLocation = locations.find(l => l.id === booking.startLocationId);
          const endLocation = locations.find(l => l.id === booking.endLocationId);

          return {
            id: booking.id,
            vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown Vehicle',
            startLocationName: startLocation?.name || 'Unknown',
            endLocationName: endLocation?.name || 'Unknown',
            startDate: new Date(booking.startDate),
            duration: booking.duration,
            finalCost: booking.finalCost,
            status: booking.status
          };
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings from API:', error);
        // Fallback to localStorage only
        this.loadFromLocalStorageOnly();
      }
    });
  }

  private loadFromLocalStorageOnly(): void {
    const localBookings = this.bookingStorage.getBookings();
    this.bookings = localBookings.map(booking => ({
      id: booking.id,
      vehicleName: 'Vehicle',
      startLocationName: 'Start Location',
      endLocationName: 'End Location',
      startDate: new Date(booking.startDate),
      duration: booking.duration,
      finalCost: booking.finalCost,
      status: booking.status
    }));
    this.isLoading = false;
  }

  editBooking(id: string): void {
    // Navigate to booking form with the booking ID
    this.router.navigate(['/booking/form', id]);
  }

  cancelBooking(id: string): void {
    const booking = this.bookings.find(b => b.id === id);
    if (!booking || booking.status !== 'pending') {
      return;
    }

    // Show confirmation dialog
    const message = this.translate.instant('booking.confirmCancelMessage');
    const confirmText = this.translate.instant('common.confirm');
    
    if (confirm(message)) {
      // Update in localStorage
      const success = this.bookingStorage.cancelBooking(id);
      
      if (success) {
        // Update local view
        booking.status = 'cancelled';
        
        // Update in store
        this.bookingStore.loadFromLocalStorage();
        
        // Try to update in API as well (optional)
        this.bookingsApi.update(id, { status: 'cancelled' }).subscribe({
          next: () => {
            this.showSuccessMessage('booking.cancelSuccess');
          },
          error: (error) => {
            console.error('Error updating booking in API:', error);
            // Still show success since localStorage was updated
            this.showSuccessMessage('booking.cancelSuccess');
          }
        });
      } else {
        this.showErrorMessage('booking.cancelError');
      }
    }
  }

  deleteBooking(id: string): void {
    // Show confirmation dialog
    const message = this.translate.instant('booking.confirmDeleteMessage');
    const confirmText = this.translate.instant('common.confirm');
    
    if (confirm(message)) {
      // Delete from localStorage
      const success = this.bookingStorage.deleteBooking(id);
      
      if (success) {
        // Remove from local view
        this.bookings = this.bookings.filter(b => b.id !== id);
        
        // Update store
        this.bookingStore.deleteBooking(id);
        
        // Try to delete from API as well (optional)
        this.bookingsApi.delete(id).subscribe({
          next: () => {
            this.showSuccessMessage('booking.deleteSuccess');
          },
          error: (error) => {
            console.error('Error deleting booking from API:', error);
            // Still show success since localStorage was updated
            this.showSuccessMessage('booking.deleteSuccess');
          }
        });
      } else {
        this.showErrorMessage('booking.deleteError');
      }
    }
  }

  private showSuccessMessage(key: string): void {
    const message = this.translate.instant(key);
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(key: string): void {
    const message = this.translate.instant(key);
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
