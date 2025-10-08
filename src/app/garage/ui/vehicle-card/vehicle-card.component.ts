import { Component, Input } from '@angular/core';
import { Vehicle } from '../../domain/models/vehicle.model';
import { ToggleFavoriteUseCase } from '../../application/use-cases/toggle-favorite.usecase';
import { FavoriteService } from '../../domain/services/favorite.service';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './vehicle-card.component.html',
  styleUrls: ['./vehicle-card.component.css']
})
export class VehicleCardComponent {
  @Input() vehicle!: Vehicle;
  private toggleFavoriteUC = new ToggleFavoriteUseCase();

  isFavorite(): boolean {
    return FavoriteService.isFavorite(this.vehicle.id.toString());
  }

  async toggleFavorite() {
    await this.toggleFavoriteUC.execute(this.vehicle.id.toString());
  }
}
