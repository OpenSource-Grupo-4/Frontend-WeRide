import { Component, inject, computed, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActiveBookingService } from '../../../booking/application/active-booking.service';
import { AuthStore } from '../../../auth/application/auth.store';
import { HomeStore } from '../../application/home.store';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader';
import { ErrorStateComponent } from '../error-state/error-state';
import { ActiveBookingCardComponent } from '../active-booking-card/active-booking-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ActiveBookingCardComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private router = inject(Router);
  private activeBookingService = inject(ActiveBookingService);
  private authStore = inject(AuthStore);
  private homeStore = inject(HomeStore);

  readonly isLoading = this.homeStore.isLoading;
  readonly error = this.homeStore.error;
  readonly hasError = this.homeStore.hasError;
  readonly features = this.homeStore.features;

  readonly activeBooking = computed(() => this.activeBookingService.getActiveBooking());
  readonly guestBookingMessage = signal(false);

  onRetry(): void {
    this.homeStore.retry();
  }

  navigateToTripDetails(): void {
    this.router.navigate(['/trip/details']);
  }

  navigateToGarage(): void {
    if (!this.authStore.session()?.isAuthenticated) {
      this.guestBookingMessage.set(true);
      return;
    }
    this.router.navigate(['/garage']);
  }

  dismissGuestMessage(): void {
    this.guestBookingMessage.set(false);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  onScheduleUnlock(): void {
    this.router.navigate(['/schedule-unlock']);
  }
}
