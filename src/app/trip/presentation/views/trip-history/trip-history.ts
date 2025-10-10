import { Component, OnInit, inject } from '@angular/core';
import { CommonModule} from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {Router} from '@angular/router';
import { forkJoin } from 'rxjs';
import {TripStore} from '../../../application/trip.store';
import {TripsApiEndpoint} from '../../../infrastructure/trips-api-endpoint';
import {VehiclesApiEndpoint} from '../../../infrastructure/vehicles-api-endpoint';

interface TripDisplay {
  route: string;
  date: string;
  vehicle: string;
  duration: string;
  distance: string;
  id: string;
  image: string;
}

@Component({
  selector: 'app-trip-history',
  standalone: true,
  imports: [MatIconModule, MatIconButton, CommonModule],
  templateUrl: './trip-history.html',
  styleUrl: './trip-history.css'
})

export class TripHistory implements OnInit {
  private router = inject(Router);
  private tripStore = inject(TripStore);
  private tripsApi = inject(TripsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);

  trips: TripDisplay[] = [];

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    this.tripStore.setLoading(true);

    this.tripsApi.getAll().subscribe({
      next: (trips: any[]) => {
        if (!trips || trips.length === 0) {
          this.trips = [];
          this.tripStore.setLoading(false);
          return;
        }

        this.tripStore.setTrips(trips);

        const vehicleRequests = trips.map((trip: any) => this.vehiclesApi.getById(trip.vehicleId));

        forkJoin(vehicleRequests).subscribe({
          next: (vehicles: any[]) => {
            this.trips = trips.map((trip: any, index: number) => {
              const vehicle = vehicles[index];
              const startDate = new Date(trip.startDate);
              const formattedDate = this.formatDate(startDate);

              const hours = Math.floor(trip.duration / 60);
              const minutes = trip.duration % 60;
              const duration = hours > 0 ? `${hours}h${minutes}min` : `${minutes} min`;

              return {
                route: this.formatRoute(trip.route),
                date: formattedDate,
                vehicle: `${vehicle.brand} ${vehicle.model}`,
                duration: duration,
                distance: `${trip.distance} km`,
                id: trip.id,
                image: vehicle.image
              };
            });

            this.tripStore.setLoading(false);
          },
          error: (error: any) => {
            console.error('Error loading vehicles:', error);
            this.tripStore.setError('Error loading vehicle data');
            this.tripStore.setLoading(false);
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading trips:', error);
        this.tripStore.setError('Error loading trips');
        this.tripStore.setLoading(false);
      }
    });
  }

  formatRoute(route: string): string {
    const parts = route.split('→');
    if (parts.length >= 2) {
      return `${parts[0].trim()} - ${parts[parts.length - 1].trim()}`;
    }
    return route;
  }

  formatDate(date: Date): string {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = date.getHours() >= 12 ? 'PM' : 'AM';

    return `${day} ${month}, ${hours}:${minutes} ${period}`;
  }

  printReceipt(trip: TripDisplay) {
    alert('Imprimiendo recibo del viaje: ' + trip.id);
  }

  viewDetails(trip: TripDisplay) {
    alert('Mostrando detalles del viaje: ' + trip.id);
  }

  seeMore() {
    alert('Cargando más viajes...');
  }

  goBack() {
    this.router.navigate(['/trip']);
  }
}
