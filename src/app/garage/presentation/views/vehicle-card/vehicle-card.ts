import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
export class VehicleCard {
  @Input() vehicle!: Vehicle;
  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<Vehicle>();
  private translate = inject(TranslateService);

  onToggleFavorite() {
    this.toggleFavorite.emit(this.vehicle.id);
  }

  onViewDetails() {
    this.viewDetails.emit(this.vehicle);
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
