import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
import { TripsApiEndpoint } from '../../../../trip/infrastructure/trips-api-endpoint';
import { BookingsApiEndpoint } from '../../../../booking/infraestructure/bookings-api-endpoint';
import { TravelHistoryApiEndpoint } from '../../../../trip/infrastructure/travel-history-api-endpoint';
import { TravelHistoryEntry } from '../../../../trip/domain/model/travel-history.entity';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-history-card',
  standalone: true,
  imports: [CommonModule, MatIcon, TranslateModule],
  templateUrl: './user-history-card.html',
  styleUrl: './user-history-card.css'
})
export class UserHistoryCard implements OnInit {
  private readonly currentUserView = inject(CurrentUserViewService);
  private readonly tripsApi = inject(TripsApiEndpoint);
  private readonly bookingsApi = inject(BookingsApiEndpoint);
  private readonly travelHistoryApi = inject(TravelHistoryApiEndpoint);
  private readonly stateService = inject(UserSettingsStateService);

  user$ = this.currentUserView.getCurrentUser$();
  trips$: Observable<any[]> = new Observable(observer => observer.next([]));
  bookings$: Observable<any[]> = new Observable(observer => observer.next([]));
  travelHistory$: Observable<TravelHistoryEntry[]> = new Observable(observer => observer.next([]));

  ngOnInit(): void {
    this.user$.subscribe(user => {
      if (user?.id) {
        this.trips$ = this.tripsApi.getMine();
        this.bookings$ = this.bookingsApi.getCompletedByUser(user.id.toString());
        this.travelHistory$ = this.travelHistoryApi.getByUserId(user.id.toString());
      } else {
        this.trips$ = new Observable(observer => observer.next([]));
        this.bookings$ = new Observable(observer => observer.next([]));
        this.travelHistory$ = new Observable(observer => observer.next([]));
      }
    });
  }

  closeCard(): void {
    this.stateService.closeSection();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'completed': '#10b981',
      'pending': '#f59e0b',
      'cancelled': '#ef4444',
      'in_progress': '#3b82f6'
    };
    return colors[status] || '#6b7280';
  }
}
