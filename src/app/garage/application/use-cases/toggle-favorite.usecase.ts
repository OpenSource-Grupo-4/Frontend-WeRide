import { Injectable } from '@angular/core';
import { FavoriteService } from '../services/favorite.service';

@Injectable({
  providedIn: 'root'
})
export class ToggleFavoriteUseCase {
  async execute(vehicleId: string): Promise<void> {
    FavoriteService.toggleFavorite(vehicleId);
  }
}
