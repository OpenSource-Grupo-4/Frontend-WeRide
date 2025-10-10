import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardActions, MatCardContent, MatCardImage, MatCardHeader, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { Vehicle } from '../../../domain/model/vehicle.model';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [
    CommonModule,
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
export class VehicleCard {
  @Input() vehicle!: Vehicle;
  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<Vehicle>();

  onToggleFavorite() {
    this.toggleFavorite.emit(this.vehicle.id);
  }

  onViewDetails() {
    this.viewDetails.emit(this.vehicle);
  }

  getStatusLabel(): string {
    const statusMap: Record<string, string> = {
      'available': 'Disponible',
      'reserved': 'Reservado',
      'maintenance': 'En mantenimiento',
      'in_use': 'En uso'
    };
    return statusMap[this.vehicle.status] || this.vehicle.status;
  }

  getTypeLabel(): string {
    const typeMap: Record<string, string> = {
      'electric_scooter': 'Scooter Eléctrico',
      'bike': 'Bicicleta',
      'electric_bike': 'Bicicleta Eléctrica'
    };
    return typeMap[this.vehicle.type] || this.vehicle.type;
  }

  getStatusClass(): string {
    return `status-${this.vehicle.status}`;
  }
}
