import { Injectable, inject, OnDestroy, effect } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ActiveBookingService } from './active-booking.service';
import { NotificationsApiEndpoint } from '../infraestructure/notifications-api-endpoint';
import { BookingsApiEndpoint } from '../infraestructure/bookings-api-endpoint';
import { AuthStore } from '../../auth/application/auth.store';
import { Booking } from '../domain/model/booking.entity';
import { toDomainBooking } from '../infraestructure/booking-assembler';
import { BookingEndingModal } from '../presentation/views/booking-ending-modal/booking-ending-modal';
import { firstValueFrom, Subscription } from 'rxjs';

interface NotificationState {
  notifiedStartIds: Set<string>;
  notifiedExpiringIds: Set<string>;
  notifiedExpiredIds: Set<string>;
}

@Injectable({
  providedIn: 'root'
})
export class BookingNotificationService implements OnDestroy {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private activeBookingService = inject(ActiveBookingService);
  private notificationsApi = inject(NotificationsApiEndpoint);
  private bookingsApi = inject(BookingsApiEndpoint);
  private authStore = inject(AuthStore);

  private checkInterval?: number;
  private isMonitoring = false;
  private stopped = false;
  private fetchInFlight = false;
  private fetchSub?: Subscription;
  private readonly CHECK_INTERVAL_MS = 60000; // 60 seconds
  private readonly EXPIRATION_WARNING_MINUTES = 5;

  // Track which bookings have already been notified to avoid duplicates
  private state: NotificationState = {
    notifiedStartIds: new Set(),
    notifiedExpiringIds: new Set(),
    notifiedExpiredIds: new Set()
  };

  /**
   * Reacciona a los cambios de sesión de auth:
   * - Sesión no autenticada (logout) => detiene el monitor.
   * - Sesión autenticada (login / sesión restaurada) => arranca el monitor si
   *   aún no está corriendo. El effect se ejecuta la primera vez al crearse el
   *   servicio con la sesión actual, de modo que con sesión restaurada el
   *   monitor se pone en marcha solo.
   */
  private sessionEffect = effect(() => {
    const session = this.authStore.session();
    if (!session?.isAuthenticated) {
      this.stopMonitoring();
    } else if (!this.isMonitoring) {
      this.startMonitoring();
    }
  });

  /**
   * Start monitoring bookings for notifications
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.stopped = false;
    this.checkActiveBookings();
    this.checkInterval = window.setInterval(() => this.checkActiveBookings(), this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop monitoring bookings
   */
  stopMonitoring(): void {
    this.stopped = true;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    this.isMonitoring = false;
    this.fetchSub?.unsubscribe();
    this.fetchSub = undefined;
    this.fetchInFlight = false;
    this.resetState();
  }

  /**
   * Fetch the current user's bookings and run the per-booking notification checks.
   * No-ops for unauthenticated users or when there is no current user.
   */
  private checkActiveBookings(): void {
    if (this.fetchInFlight) {
      return;
    }

    const session = this.authStore.session();
    const userId = this.authStore.currentUser()?.id;
    if (!session?.isAuthenticated || !userId) {
      return;
    }

    this.fetchInFlight = true;
    this.fetchSub?.unsubscribe();
    this.fetchSub = this.bookingsApi.getByUserId(userId).subscribe({
      next: (bookings) => {
        this.fetchSub = undefined;
        this.fetchInFlight = false;
        if (this.stopped) {
          return;
        }
        const now = new Date();
        for (const booking of bookings) {
          const domainBooking = toDomainBooking(booking);
          this.checkBookingStart(domainBooking, now);
          this.checkBookingExpiring(domainBooking, now);
          this.checkBookingExpired(domainBooking, now);
        }
      },
      error: (error) => {
        this.fetchSub = undefined;
        this.fetchInFlight = false;
        console.error('Booking notification check failed:', error);
      }
    });
  }


  /**
   * Scenario 1: Notify when booking starts
   */
  private checkBookingStart(booking: Booking, now: Date): void {
    if (this.state.notifiedStartIds.has(booking.id)) {
      return;
    }

    const startTime = new Date(booking.startDate);
    const timeDiffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);

    // Trigger if within 1 minute window (before or after start time)
    if (Math.abs(timeDiffMinutes) <= 1 && booking.status === 'confirmed') {
      this.notifyBookingStart(booking);
      this.state.notifiedStartIds.add(booking.id);
    }
  }

  /**
   * Scenario 2: Notify when booking is about to expire
   */
  private checkBookingExpiring(booking: Booking, now: Date): void {
    if (!booking.endDate || this.state.notifiedExpiringIds.has(booking.id)) {
      return;
    }

    const endTime = new Date(booking.endDate);
    const timeUntilEndMinutes = (endTime.getTime() - now.getTime()) / (1000 * 60);

    // Trigger if less than 5 minutes remaining
    if (timeUntilEndMinutes <= this.EXPIRATION_WARNING_MINUTES &&
        timeUntilEndMinutes > 0 &&
        !booking.actualStartDate &&
        (booking.status === 'confirmed' || booking.status === 'pending')) {
      this.notifyBookingExpiring(booking, Math.ceil(timeUntilEndMinutes));
      this.state.notifiedExpiringIds.add(booking.id);
    }
  }

  /**
   * Scenario 3: Notify when booking has expired without starting trip
   */
  private checkBookingExpired(booking: Booking, now: Date): void {
    if (!booking.endDate || this.state.notifiedExpiredIds.has(booking.id)) {
      return;
    }

    const endTime = new Date(booking.endDate);
    const hasExpired = now.getTime() > endTime.getTime();

    // Trigger if expired and trip was never started
    if (hasExpired &&
        !booking.actualStartDate &&
        booking.status !== 'cancelled' &&
        booking.status !== 'completed') {
      this.notifyBookingExpired(booking);
      this.state.notifiedExpiredIds.add(booking.id);
    }
  }

  /**
   * Show notification for booking start
   */
  private notifyBookingStart(booking: Booking): void {
    const title = this.translate.instant('booking.notifications.started.title');
    const message = this.translate.instant('booking.notifications.started.message', {
      bookingId: booking.id.substring(0, 8)
    });

    // Show toast notification
    this.showSnackbar(message, 'success');

    // Create persistent notification record
    this.createNotificationRecord(
      booking.userId,
      title,
      message,
      'info',
      'booking',
      'medium',
      booking.id
    );
  }

  /**
   * Show notification for booking about to expire
   */
  private notifyBookingExpiring(booking: Booking, minutesRemaining: number): void {
    const title = this.translate.instant('booking.notifications.expiring.title');
    const message = this.translate.instant('booking.notifications.expiring.message', {
      minutes: minutesRemaining
    });

    // Show toast notification
    this.showSnackbar(message, 'warning');

    // Show modal dialog for critical warning
    this.dialog.open(BookingEndingModal, {
      data: {
        minutes: minutesRemaining,
        extendCost: 5.00 // Default extension cost, should come from business logic
      },
      disableClose: false,
      width: '400px'
    });

    // Create persistent notification record
    this.createNotificationRecord(
      booking.userId,
      title,
      message,
      'warning',
      'booking',
      'high',
      booking.id
    );
  }

  /**
   * Show notification for expired booking
   */
  private notifyBookingExpired(booking: Booking): void {
    const title = this.translate.instant('booking.notifications.expired.title');
    const message = this.translate.instant('booking.notifications.expired.message');

    // Show toast notification
    this.showSnackbar(message, 'error');

    // Create persistent notification record
    this.createNotificationRecord(
      booking.userId,
      title,
      message,
      'error',
      'booking',
      'high',
      booking.id
    );

    // Clear the active booking from localStorage since it's expired
    this.activeBookingService.clearActiveBooking();
  }

  /**
   * Display a snackbar notification
   */
  private showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.snackBar.open(message, this.translate.instant('common.close'), {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [`snackbar-${type}`]
    });
  }

  /**
   * Create a persistent notification record in the database
   */
  private async createNotificationRecord(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success',
    category: string,
    priority: 'low' | 'medium' | 'high',
    relatedEntityId?: string
  ): Promise<void> {
    try {
      await firstValueFrom(this.notificationsApi.create({
        userId,
        title,
        message,
        type,
        category,
        priority,
        createdAt: new Date().toISOString(),
        readAt: null,
        isRead: false,
        actionRequired: type === 'warning' || type === 'error',
        relatedEntityId,
        relatedEntityType: 'booking',
        icon: this.getIconForType(type),
        color: this.getColorForType(type),
        expiresAt: undefined,
        promoCode: undefined,
        discount: undefined
      }));
    } catch (error) {
      console.error('Error creating notification record:', error);
    }
  }

  /**
   * Get icon for notification type
   */
  private getIconForType(type: string): string {
    const icons: Record<string, string> = {
      'info': 'info',
      'warning': 'warning',
      'error': 'error',
      'success': 'check_circle'
    };
    return icons[type] || 'notifications';
  }

  /**
   * Get color for notification type
   */
  private getColorForType(type: string): string {
    const colors: Record<string, string> = {
      'info': '#2196F3',
      'warning': '#FF9800',
      'error': '#F44336',
      'success': '#4CAF50'
    };
    return colors[type] || '#757575';
  }

  /**
   * Reset notification state (clear tracking sets)
   */
  private resetState(): void {
    this.state.notifiedStartIds.clear();
    this.state.notifiedExpiringIds.clear();
    this.state.notifiedExpiredIds.clear();
  }

  ngOnDestroy(): void {
    // Destruye el effect antes de detener el monitor: al destruirlo ya no se
    // notificarán cambios de sesión sobre un servicio en destrucción.
    this.sessionEffect.destroy();
    this.stopMonitoring();
  }
}
