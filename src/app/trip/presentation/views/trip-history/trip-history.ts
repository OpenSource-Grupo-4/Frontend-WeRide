import { Component, OnInit, inject } from '@angular/core';
import { CommonModule} from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {Router} from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { TripService } from '../../../../core/services/trip.service';
import { VehicleService } from '../../../../core/services/vehicle.service';
import { Trip } from '../../../domain/model/trip.entity';
import { Vehicle } from '../../../domain/model/vehicle.entity';

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
  imports: [MatIconModule, MatIconButton, CommonModule, TranslateModule],
  templateUrl: './trip-history.html',
  styleUrl: './trip-history.css'
})

export class TripHistory implements OnInit {
  private router = inject(Router);
  private tripService = inject(TripService);
  private vehicleService = inject(VehicleService);
  private translate = inject(TranslateService);

  trips: TripDisplay[] = [];
  loading = false;

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    this.loading = true;

    this.tripService.loadTrips().subscribe({
      next: (trips: Trip[]) => {
        if (!trips || trips.length === 0) {
          this.trips = [];
          this.loading = false;
          return;
        }

        // Get vehicles for all trips
        this.vehicleService.loadVehicles().subscribe({
          next: (vehicles: Vehicle[]) => {
            this.trips = trips.map((trip: Trip) => {
              const vehicle = vehicles.find(v => v.id === trip.vehicleId);
              const startDate = new Date(trip.startDate);
              const formattedDate = this.formatDate(startDate);

              const hours = Math.floor(trip.duration / 60);
              const minutes = trip.duration % 60;
              const duration = hours > 0 ? `${hours}h${minutes}min` : `${minutes} min`;

              return {
                route: this.formatRoute(trip.route),
                date: formattedDate,
                vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}` : this.translate.instant('trip.vehicleNotFound'),
                duration: duration,
                distance: `${trip.distance} km`,
                id: trip.id,
                image: vehicle?.image || 'assets/vehicles/default.jpg'
              };
            });

            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error loading vehicles:', error);
            this.loading = false;
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading trips:', error);
        this.loading = false;
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
    const lang = this.translate.currentLang || 'es';
    let formatted: string;

    try {
      const datePart = date.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
      const timePart = date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
      formatted = `${datePart}, ${timePart}`;
    } catch {
      // Fallback for unsupported locales: keep the same shape as the main path.
      const fallbackLang = lang.startsWith('es') ? 'es-ES' : 'en-US';
      const datePart = date.toLocaleDateString(fallbackLang, { day: 'numeric', month: 'short' });
      const timePart = date.toLocaleTimeString(fallbackLang, { hour: '2-digit', minute: '2-digit' });
      formatted = `${datePart}, ${timePart}`;
    }

    return formatted;
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
