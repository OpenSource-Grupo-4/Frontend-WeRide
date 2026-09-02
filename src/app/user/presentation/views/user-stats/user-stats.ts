import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
import { User, UserStatistics } from '../../../domain/model/user.entity';

const EMPTY_STATS: UserStatistics = {
  totalTrips: 0,
  totalDistance: 0,
  totalSpent: 0,
  averageRating: 0
};

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './user-stats.html',
  styleUrl: './user-stats.css'
})
export class UserStats implements OnInit {
  private readonly currentUserView = inject(CurrentUserViewService);
  user$: Observable<User | null> = this.currentUserView.getCurrentUser$();

  ngOnInit(): void {}

  safeStats(user: User | null): UserStatistics {
    return user?.statistics || EMPTY_STATS;
  }

  getInitials(name?: string | null): string {
    if (!name) {
      return 'G';
    }
    return name
      .split(' ')
      .filter(part => part)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('') || 'G';
  }
}
