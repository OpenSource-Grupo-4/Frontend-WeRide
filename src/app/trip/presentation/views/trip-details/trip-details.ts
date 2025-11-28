import { Component, OnInit, inject } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TripService, TripWithDetails } from '../../../../core/services/trip.service';

@Component({
  selector: 'app-trip-details',
  imports: [
    MatCard,
    MatButton,
    CommonModule,
    TranslateModule,
  ],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css'
})
export class TripDetails implements OnInit {
  private router = inject(Router);
  private tripService = inject(TripService);

  currentTrip: TripWithDetails | null = null;
  location = '';
  battery = 0;
  remainingTime = '';
  extraTime = '';
  rating = 0;
  loading = false;

  ngOnInit() {
    this.loadCurrentTripData();
  }

  loadCurrentTripData() {
    this.loading = true;

    this.tripService.loadLatestTrip().subscribe({
      next: (tripWithDetails: TripWithDetails | null) => {
        if (tripWithDetails) {
          this.currentTrip = tripWithDetails;
          this.updateDisplayData(tripWithDetails);
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading trip data:', error);
        this.loading = false;
      }
    });
  }

  private updateDisplayData(trip: TripWithDetails) {
    if (trip.endLocation) {
      this.location = trip.endLocation.address;
    }

    if (trip.vehicle) {
      this.battery = trip.vehicle.battery;
    }

    const durationMinutes = Math.floor(trip.duration);
    const durationSeconds = Math.floor((trip.duration % 1) * 60);
    this.remainingTime = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')} min`;
    this.extraTime = 'Aun no sobrepasas tu tiempo';
  }

  setRating(stars: number) {
    this.rating = stars;
  }

  goToHistory() {
    this.router.navigate(['/trip/history']);
  }

  goToSettings() {
    this.router.navigate(['/trip/settings']);
  }
}

