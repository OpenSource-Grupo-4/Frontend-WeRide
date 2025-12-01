import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TripStore } from '../../../application/trip.store';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { TripInitializerService } from '../../../application/trip-initializer.service';

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
export class TripDetails implements OnInit, OnDestroy {
  private router = inject(Router);
  private tripStore = inject(TripStore);
  private activeBookingService = inject(ActiveBookingService);
  private tripInitializer = inject(TripInitializerService);

  isActiveTrip = computed(() => this.tripStore.isActiveTrip());
  currentVehicle = computed(() => this.tripStore.currentVehicle());
  currentLocation = computed(() => this.tripStore.currentLocation());
  destinationLocation = computed(() => this.tripStore.destinationLocation());
  tripStartTime = computed(() => this.tripStore.tripStartTime());
  estimatedEndTime = computed(() => this.tripStore.estimatedEndTime());

  elapsedTime = signal<string>('00:00');
  remainingTime = signal<string>('00:00');
  extraTime = signal<string>('Aún no sobrepasas tu tiempo');
  rating = signal<number>(0);

  private timeUpdateInterval?: number;

  async ngOnInit() {
    // Verificar si hay un viaje activo
    if (this.isActiveTrip()) {
      this.startTimeUpdates();
      return;
    }

    // Si no hay viaje activo, verificar si hay un booking activo desbloqueado
    const activeBooking = this.activeBookingService.getActiveBooking();

    if (activeBooking && this.tripInitializer.canInitializeTripFromBooking(activeBooking)) {
      // Intentar inicializar el viaje desde el booking
      const initialized = await this.tripInitializer.initializeTripFromBooking(activeBooking);

      if (initialized && this.isActiveTrip()) {
        this.startTimeUpdates();
      }
    }
  }

  ngOnDestroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  private startTimeUpdates() {
    this.updateTimes();
    this.timeUpdateInterval = window.setInterval(() => {
      this.updateTimes();
    }, 1000);
  }

  private updateTimes() {
    const startTime = this.tripStartTime();
    const estimatedEnd = this.estimatedEndTime();

    if (!startTime || !estimatedEnd) return;

    const now = new Date();
    const elapsed = now.getTime() - startTime.getTime();
    const remaining = estimatedEnd.getTime() - now.getTime();

    const elapsedMinutes = Math.floor(elapsed / 60000);
    const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
    this.elapsedTime.set(`${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')} min`);

    if (remaining > 0) {
      const remainingMinutes = Math.floor(remaining / 60000);
      const remainingSeconds = Math.floor((remaining % 60000) / 1000);
      this.remainingTime.set(`${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')} min`);
      this.extraTime.set('Aún no sobrepasas tu tiempo');
    } else {
      const overtimeMinutes = Math.floor(Math.abs(remaining) / 60000);
      const overtimeSeconds = Math.floor((Math.abs(remaining) % 60000) / 1000);
      this.remainingTime.set('00:00 min');
      this.extraTime.set(`Tiempo extra: ${overtimeMinutes.toString().padStart(2, '0')}:${overtimeSeconds.toString().padStart(2, '0')} min`);
    }
  }

  getVehicleType(): string {
    const vehicle = this.currentVehicle();
    if (!vehicle) return 'Electric Scooter';

    const typeMap: { [key: string]: string } = {
      'electric_scooter': 'Scooter Eléctrico',
      'bike': 'Bicicleta',
      'electric_bike': 'Bicicleta Eléctrica'
    };
    return typeMap[vehicle.type] || 'Electric Scooter';
  }

  setRating(stars: number) {
    this.rating.set(stars);
  }

  goToHistory() {
    this.router.navigate(['/trip/history']);
  }

  goToSettings() {
    this.router.navigate(['/user/profile']);
  }

  goToGarage() {
    this.router.navigate(['/garage']);
  }

  goToScheduleBooking() {
    this.router.navigate(['/garage']);
  }
}

