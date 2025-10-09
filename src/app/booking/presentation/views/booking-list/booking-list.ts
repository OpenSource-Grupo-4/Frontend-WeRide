import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infraestructure/vehicles-api-endpoint';
import { LocationsApiEndpoint } from '../../../infraestructure/locations-api-endpoint';
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
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './booking-list.html',
  styleUrl: './booking-list.css'
})
export class BookingListComponent implements OnInit {
  private bookingsApi = inject(BookingsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  private locationsApi = inject(LocationsApiEndpoint);

  bookings: BookingView[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    forkJoin({
      bookings: this.bookingsApi.getAll(),
      vehicles: this.vehiclesApi.getAll(),
      locations: this.locationsApi.getAll()
    }).subscribe({
      next: ({ bookings, vehicles, locations }) => {
        this.bookings = bookings.map(booking => {
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
        console.error('Error loading bookings:', error);
        this.isLoading = false;
      }
    });
  }

  editBooking(id: string): void {
    console.log('Edit booking:', id);
  }

  cancelBooking(id: string): void {
    const booking = this.bookings.find(b => b.id === id);
    if (booking && booking.status === 'pending') {
      this.bookingsApi.update(id, { status: 'cancelled' }).subscribe({
        next: () => {
          booking.status = 'cancelled';
        },
        error: (error) => console.error('Error cancelling booking:', error)
      });
    }
  }
}
