import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserStore } from '../../../application/user.store';
import { User } from '../../../domain/model/user.entity';
import { UserProfile } from '../user-profile/user-profile';

@Component({
  selector: 'app-user-section',
  standalone: true,
  imports: [CommonModule, UserProfile],
  templateUrl: './user-section.html',
  styleUrl: './user-section.css'
})
export class UserSection implements OnInit {
  private readonly userStore = inject(UserStore);
  user$: Observable<User | null> = this.userStore.getGuestUser$();

  readonly sidebarLinks = [
    { icon: 'home', label: 'Inicio' },
    { icon: 'garage', label: 'Garage' },
    { icon: 'account_circle', label: 'Tu' },
    { icon: 'credit_card', label: 'Planes' },
    { icon: 'directions_bike', label: 'Viaje' },
    { icon: 'event_note', label: 'Reservas' }
  ];

  ngOnInit(): void {
    this.userStore.loadUsers();
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
