import { Component, Input, Output, EventEmitter, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCard, MatCardActions, MatCardContent, MatCardImage, MatCardHeader, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { BookingConfirmationModal } from '../../../../booking/presentation/views/booking-confirmation-modal/booking-confirmation-modal';
import { FavoriteStore } from '../../../application/favorite.store';
import { AuthStore } from '../../../../auth/application/auth.store';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatCard,
    MatCardContent,
    MatCardActions,
    MatCardImage,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatIcon,
    MatButton,
    MatIconButton,
    MatChip,
    MatChipSet
  ],
  templateUrl: './vehicle-card.html',
  styleUrl: './vehicle-card.css'
})
export class VehicleCard implements OnDestroy {
  @Input() vehicle!: Vehicle;
  @Output() viewDetails = new EventEmitter<Vehicle>();
  @Output() reserve = new EventEmitter<Vehicle>();
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private favoriteStore = inject(FavoriteStore);
  private authStore = inject(AuthStore);

  isTogglingFavorite = false;
  /**
   * Pending rollback check for the in-flight toggle. Tracked so a rapid
   * re-toggle on the same card cancels the previous check (its 500ms window
   * belongs to a stale toggle and must not read the store's shared error slot),
   * and so a destroyed card never fires a rollback/snackbar after teardown.
   */
  private rollbackTimer?: ReturnType<typeof setTimeout>;

  ngOnDestroy() {
    if (this.rollbackTimer) {
      clearTimeout(this.rollbackTimer);
      this.rollbackTimer = undefined;
    }
  }

  onToggleFavorite() {
    if (this.isTogglingFavorite) return;

    this.isTogglingFavorite = true;
    const previousState = this.vehicle.favorite;

    // Optimistic UI update
    this.vehicle.favorite = !this.vehicle.favorite;

    // Guests cannot persist favorites: explain instead of pretending.
    if (!this.authStore.session()?.isAuthenticated) {
      this.vehicle.favorite = previousState;
      this.snackBar.open(
        this.translate.instant('garage.favorites.loginRequired'),
        this.translate.instant('common.close'),
        {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );
      this.isTogglingFavorite = false;
      return;
    }

    const userId = this.authStore.currentUser()?.id;
    if (!userId) {
      // No usable user id: roll back and stay consistent with store state.
      this.vehicle.favorite = previousState;
      this.isTogglingFavorite = false;
      return;
    }

    // Persist through the store (repository → API + localStorage).
    this.favoriteStore.toggleFavorite({ userId, vehicleId: this.vehicle.id });

    // Cancel any pending check from a previous toggle on this card: with the
    // store now clearing the error at toggle start, the shared error slot only
    // holds errors from the CURRENT toggle window, so a stale check firing after
    // a rapid re-toggle would roll back the wrong attempt.
    if (this.rollbackTimer) {
      clearTimeout(this.rollbackTimer);
      this.rollbackTimer = undefined;
    }

    // Check for errors after a delay
    this.rollbackTimer = setTimeout(() => {
      this.rollbackTimer = undefined;
      const error = this.favoriteStore.error();
      if (error) {
        // Rollback on error
        this.vehicle.favorite = previousState;
        this.snackBar.open(
          this.translate.instant('garage.favorites.error'),
          this.translate.instant('common.retry'),
          {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        ).onAction().subscribe(() => {
          this.onToggleFavorite();
        });
      }
      this.isTogglingFavorite = false;
    }, 500);
  }

  onViewDetails() {
    this.viewDetails.emit(this.vehicle);
  }

  onReserve() {
    // Open confirmation modal
    const dialogRef = this.dialog.open(BookingConfirmationModal, {
      data: { vehicle: this.vehicle },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'booking-confirmation-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // book_now (immediate) AND schedule both go through the parent,
        // which routes to /schedule-unlock (immediate or scheduled) —
        // the booking is created against the API there.
        this.reserve.emit(this.vehicle);
      }
    });
  }

  getStatusLabel(): string {
    return this.translate.instant(`garage.vehicle.statuses.${this.vehicle.status}`) || this.vehicle.status;
  }

  getTypeLabel(): string {
    return this.translate.instant(`garage.vehicle.types.${this.vehicle.type}`) || this.vehicle.type;
  }

  getStatusClass(): string {
    return `status-${this.vehicle.status}`;
  }
}
