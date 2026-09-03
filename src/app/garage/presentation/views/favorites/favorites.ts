import {Component, OnInit, inject, computed, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {VehicleCard} from '../vehicle-card/vehicle-card';
import {Vehicle} from '../../../domain/model/vehicle.model';
import {GetVehiclesUseCase} from '../../../application/use-cases/get-vehicles.usecase';
import {ToggleFavoriteUseCase} from '../../../application/use-cases/toggle-favorite.usecase';
import {FavoriteStore} from '../../../application/favorite.store';
import {AuthStore} from '../../../../auth/application/auth.store';
import {ActiveBookingService} from '../../../../booking/application/active-booking.service';
import {BookingConfirmationModal} from '../../../../booking/presentation/views/booking-confirmation-modal/booking-confirmation-modal';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, VehicleCard, TranslateModule],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class Favorites implements OnInit {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private activeBookingService = inject(ActiveBookingService);
  private getVehiclesUseCase = inject(GetVehiclesUseCase);
  private toggleFavoriteUseCase = inject(ToggleFavoriteUseCase);
  private favoriteStore = inject(FavoriteStore);
  private authStore = inject(AuthStore);

  // Use signal for reactivity
  allVehicles = signal<Vehicle[]>([]);
  isLoading = computed(() => this.favoriteStore.isLoading());
  error = computed(() => this.favoriteStore.error());

  // Reactive computed property that automatically updates when favorites change
  favoriteVehicles = computed(() => {
    const favoriteIds = this.favoriteStore.favoriteVehicleIds();
    const vehicles = this.allVehicles();

    const filtered = vehicles.filter(v => {
      const match = favoriteIds.includes(v.id);
      return match;
    });

    return filtered.map(v => ({
      ...v,
      favorite: true
    }));
  });

  async ngOnInit() {
    await this.hydrateFavorites();
    await this.loadVehicles();
  }

  /** Resuelve los Favorite ids desde el servidor para que el toggle de
   *  un-favorite pueda borrar la fila remota tras un reload. */
  private async hydrateFavorites(): Promise<void> {
    if (!this.authStore.session()?.isAuthenticated) return;
    const userId = this.authStore.currentUser()?.id;
    if (!userId) return;
    this.favoriteStore.loadUserFavorites(userId);
    await Promise.resolve();
  }

  async loadVehicles() {
    try {
      const vehicles = await this.getVehiclesUseCase.execute();
      this.allVehicles.set(vehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }

  get hasFavorites(): boolean {
    return this.favoriteVehicles().length > 0;
  }

  navigateToScheduleUnlock(vehicle: Vehicle): void {
    const activeBooking = this.activeBookingService.getActiveBooking();

    if (activeBooking) {
      const snackBarRef = this.snackBar.open(
        this.translate.instant('booking.alreadyHasActive'),
        this.translate.instant('home.actions.viewBookings'),
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['info-snackbar']
        }
      );

      snackBarRef.onAction().subscribe(() => {
        this.router.navigate(['/trip/details']);
      });
      return;
    }

    // Open confirmation modal
    const dialogRef = this.dialog.open(BookingConfirmationModal, {
      data: { vehicle },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'booking-confirmation-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const immediate = result.action === 'book_now';
        this.router.navigate(['/schedule-unlock'], {
          state: { vehicle, immediate }
        });
      }
    });
  }
}

// Debug log
