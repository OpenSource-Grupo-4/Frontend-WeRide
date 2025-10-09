import { Component, OnInit, inject } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import { forkJoin } from 'rxjs';
import {TripStore} from '../../../application/trip.store';
import {TripsApiEndpoint} from '../../../infrastructure/trips-api-endpoint';
import {VehiclesApiEndpoint} from '../../../infrastructure/vehicles-api-endpoint';
import {LocationsApiEndpoint} from '../../../infrastructure/locations-api-endpoint';

@Component({
  selector: 'app-trip-details',
  imports: [
    MatCard,
    MatButton,
    CommonModule,
  ],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css'
})
export class TripDetails implements OnInit {
  private router = inject(Router);
  private tripStore = inject(TripStore);
  private tripsApi = inject(TripsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  private locationsApi = inject(LocationsApiEndpoint);

  location = '';
  battery = 0;
  remainingTime = '';
  extraTime = '';
  rating = 0;

  ngOnInit() {
    this.loadCurrentTripData();
  }

  loadCurrentTripData() {
    this.tripStore.setLoading(true);

    this.tripsApi.getAll().subscribe({
      next: (trips: any) => {
        const currentTrip = trips.find((t: any) => t.status === 'completed') || trips[0];

        if (currentTrip) {
          this.tripStore.setCurrentTrip(currentTrip);

          forkJoin({
            vehicle: this.vehiclesApi.getById(currentTrip.vehicleId),
            location: this.locationsApi.getById(currentTrip.endLocationId)
          }).subscribe({
            next: ({ vehicle, location }: any) => {
              this.tripStore.setCurrentVehicle(vehicle);
              this.tripStore.setCurrentLocation(location);

              this.location = location.address;
              this.battery = vehicle.battery;

              const durationMinutes = Math.floor(currentTrip.duration);
              const durationSeconds = Math.floor((currentTrip.duration % 1) * 60);
              this.remainingTime = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')} min`;
              this.extraTime = 'Aun no sobrepasas tu tiempo';

              this.tripStore.setLoading(false);
            },
            error: (error: any) => {
              this.tripStore.setError(error.message);
              this.tripStore.setLoading(false);
            }
          });
        }
      },
      error: (error: any) => {
        this.tripStore.setError(error.message);
        this.tripStore.setLoading(false);
      }
    });
  }

  setRating(stars: number) {
    this.rating = stars;
  }

  goToHistory() {
    this.router.navigate(['/trip/history']);
  }

  goToSettings() {
  }
}

