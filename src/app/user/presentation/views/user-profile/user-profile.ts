import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { User } from '../../../domain/model/user.entity';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile {
  @Input() user: User | null = null;

  readonly mainOptions = [
    { icon: 'account_balance_wallet', label: 'Cartera' },
    { icon: 'history', label: 'Historial' },
    { icon: 'security', label: 'Centro de seguridad' },
    { icon: 'help', label: 'Ayuda' },
    { icon: 'settings', label: 'Ajustes' }
  ];

  readonly quickActions = [
    { label: 'Administrar tu cuenta' },
    { label: 'Personalizar tu perfil' }
  ];

  get stats(): { label: string; value: string }[] {
    if (!this.user?.statistics) {
      return [
        { label: 'Metros', value: '0' },
        { label: 'Trayectos', value: '0' }
      ];
    }

    const formatter = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
    const { totalDistance, totalTrips } = this.user.statistics;
    return [
      { label: 'Metros', value: formatter.format(totalDistance ?? 0) },
      { label: 'Trayectos', value: formatter.format(totalTrips ?? 0) }
    ];
  }

  get hasProfilePicture(): boolean {
    return !!this.user?.profilePicture;
  }

  getInitials(name?: string | null): string {
    if (!name) {
      return 'G';
    }
    return (
      name
        .split(' ')
        .filter(part => part)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? '')
        .join('') || 'G'
    );
  }
}
