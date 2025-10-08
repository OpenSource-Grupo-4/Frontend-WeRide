import { FavoriteService } from '../../domain/services/favorite.service';

export class ToggleFavoriteUseCase {
  async execute(vehicleId: string): Promise<void> {
    FavoriteService.toggleFavorite(vehicleId);
  }
}
