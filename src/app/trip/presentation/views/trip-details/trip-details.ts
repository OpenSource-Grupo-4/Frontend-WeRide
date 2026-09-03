import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { TripStore } from '../../../application/trip.store';
import { BookingStore } from '../../../../booking/application/booking.store';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { TripInitializerService } from '../../../application/trip-initializer.service';
import { Booking, BookingActivationStatus } from '../../../../booking/domain/model/booking.entity';
import { TripsApiEndpoint } from '../../../infrastructure/trips-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infrastructure/vehicles-api-endpoint';
import { LocationsApiEndpoint } from '../../../infrastructure/locations-api-endpoint';
import { Trip } from '../../../domain/model/trip.entity';
import { Vehicle } from '../../../domain/model/vehicle.entity';
import { Location } from '../../../domain/model/location.entity';

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [
    MatCard,
    MatCardModule,
    MatButton,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css'
})
export class TripDetails implements OnInit, OnDestroy {
  private router = inject(Router);
  private tripStore = inject(TripStore);
  private bookingStore = inject(BookingStore);
  private activeBookingService = inject(ActiveBookingService);
  private tripInitializer = inject(TripInitializerService);
  private translate = inject(TranslateService);
  private tripsApi = inject(TripsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  private locationsApi = inject(LocationsApiEndpoint);
  private destroy$ = new Subject<void>();

  // Viaje seleccionado desde el historial (router state `tripId`) y sus
  // detalles resueltos (vehículo y ubicaciones pueden fallar contra el
  // backend real, por eso son opcionales).
  selectedTrip = signal<Trip | null>(null);
  detailVehicle = signal<Vehicle | null>(null);
  detailStartLocation = signal<Location | null>(null);
  detailEndLocation = signal<Location | null>(null);

  isActiveTrip = computed(() => this.tripStore.isActiveTrip());
  currentVehicle = computed(() => this.tripStore.currentVehicle());
  currentLocation = computed(() => this.tripStore.currentLocation());
  destinationLocation = computed(() => this.tripStore.destinationLocation());
  tripStartTime = computed(() => this.tripStore.tripStartTime());
  estimatedEndTime = computed(() => this.tripStore.estimatedEndTime());

  elapsedTime = signal<string>('00:00');
  remainingTime = signal<string>('00:00');
  extraTime = signal<string>(this.translate.instant('trip.extraTimeDefault'));
  rating = signal<number>(0);

  relatedBooking = signal<Booking | null>(null);
  canActivateBooking = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  private timeUpdateInterval?: number;

  async ngOnInit() {
    this.bookingStore.getActiveBooking$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(booking => {
        this.relatedBooking.set(booking);
        this.canActivateBooking.set(!!(
          booking &&
          booking.activationStatus === 'scheduled' &&
          !booking.isActivated
        ));
      });

    // Navegación desde el historial con un tripId en el router state: se
    // muestra ese viaje en lugar del viaje activo / estado vacío. Se sale
    // antes de tocar el flujo del viaje activo (temporizadores, booking).
    const tripId = this.router.getCurrentNavigation()?.extras.state?.['tripId'];
    if (tripId) {
      this.isLoading.set(false);
      await this.loadTripFromHistory(tripId);
      return;
    }

    if (this.isActiveTrip()) {
      this.startTimeUpdates();
      this.isLoading.set(false);
      return;
    }

    const activeBooking = this.activeBookingService.getActiveBooking();

    if (activeBooking && this.tripInitializer.canInitializeTripFromBooking(activeBooking)) {
      const initialized = await this.tripInitializer.initializeTripFromBooking(activeBooking);

      if (initialized && this.isActiveTrip()) {
        this.startTimeUpdates();
      }
    }

    this.isLoading.set(false);
  }

  /**
   * Carga el viaje seleccionado desde el historial y resuelve sus detalles
   * (vehículo y ubicaciones). Cada detalle se resuelve con `.catch(() => null)`
   * para que la vista funcione aunque el backend no tenga el recurso (p. ej.
   * GET /location/{id} devuelve 404 hoy en el backend real).
   */
  private async loadTripFromHistory(tripId: string): Promise<void> {
    try {
      const trip = await firstValueFrom(this.tripsApi.getById(tripId));
      this.selectedTrip.set(trip);

      // Detalles opcionales: si uno falla se muestra el viaje igualmente.
      const vehicle = firstValueFrom(this.vehiclesApi.getById(trip.vehicleId)).catch(() => null);
      const startLocation = trip.startLocationId
        ? firstValueFrom(this.locationsApi.getById(trip.startLocationId)).catch(() => null)
        : Promise.resolve(null);
      const endLocation = trip.endLocationId
        ? firstValueFrom(this.locationsApi.getById(trip.endLocationId)).catch(() => null)
        : Promise.resolve(null);

      const [resolvedVehicle, resolvedStart, resolvedEnd] = await Promise.all([
        vehicle,
        startLocation,
        endLocation
      ]);

      this.detailVehicle.set(resolvedVehicle);
      this.detailStartLocation.set(resolvedStart);
      this.detailEndLocation.set(resolvedEnd);
    } catch (error) {
      console.error('Error cargando el viaje desde el historial:', error);
      this.selectedTrip.set(null);
    }
  }

  ngOnDestroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
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
      this.extraTime.set(this.translate.instant('trip.extraTimeDefault'));
    } else {
      const overtimeMinutes = Math.floor(Math.abs(remaining) / 60000);
      const overtimeSeconds = Math.floor((Math.abs(remaining) % 60000) / 1000);
      this.remainingTime.set('00:00 min');
      this.extraTime.set(this.translate.instant('trip.extraTimeValue', {
        time: `${overtimeMinutes.toString().padStart(2, '0')}:${overtimeSeconds.toString().padStart(2, '0')} min`
      }));
    }
  }

  getVehicleType(): string {
    const vehicle = this.currentVehicle();
    if (!vehicle) return this.translate.instant('trip.electricScooter');

    const typeMap: { [key: string]: string } = {
      'electric_scooter': 'trip.electricScooter',
      'bike': 'garage.vehicle.types.bike',
      'electric_bike': 'garage.vehicle.types.electric_bike'
    };
    const key = typeMap[vehicle.type] || 'trip.electricScooter';
    return this.translate.instant(key);
  }
  goToScheduleBooking() {
    this.router.navigate(['/garage']);
  }

  setRating(stars: number) {
    this.rating.set(stars);
  }

  goToHistory() {
    this.router.navigate(['/trip/history']);
  }

  goToSettings() {
    this.router.navigate(['/user']);
  }

  goToGarage() {
    this.router.navigate(['/garage']);
  }

  async activateBooking() {
    const booking = this.relatedBooking();
    if (!booking || !this.canActivateBooking()) return;

    try {
      await this.bookingStore.activateBooking(booking.id);

      this.router.navigate(['/trip'], {
        queryParams: {
          bookingActivated: true,
          bookingId: booking.id
        }
      });
    } catch (error) {
      console.error('Error activating booking:', error);
    }
  }

  getBookingStatusIcon(status?: BookingActivationStatus): string {
    const iconMap: { [key: string]: string } = {
      'scheduled': 'schedule',
      'active': 'play_circle',
      'completed': 'check_circle',
      'cancelled': 'cancel'
    };
    return iconMap[status || 'scheduled'];
  }

  getBookingStatusText(status?: BookingActivationStatus): string {
    const textMap: { [key: string]: string } = {
      'scheduled': 'booking.status.scheduled',
      'active': 'booking.status.active',
      'completed': 'booking.status.completed',
      'cancelled': 'booking.status.cancelled'
    };
    return this.translate.instant(textMap[status || 'scheduled']);
  }

  getBookingStatusClass(status?: BookingActivationStatus): string {
    return `booking-status-${status || 'scheduled'}`;
  }
}

