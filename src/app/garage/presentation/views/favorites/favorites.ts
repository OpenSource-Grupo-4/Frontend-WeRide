import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {VehicleCard} from '../vehicle-card/vehicle-card';
import {Vehicle} from '../../../domain/model/vehicle.model';
import {GetVehiclesUseCase} from '../../../application/use-cases/get-vehicles.usecase';
import {FavoriteService} from '../../../application/services/favorite.service';
import {ToggleFavoriteUseCase} from '../../../application/use-cases/toggle-favorite.usecase';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, VehicleCard],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class Favorites implements OnInit {
  favoriteVehicles: Vehicle[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private getVehiclesUseCase: GetVehiclesUseCase,
    private toggleFavoriteUseCase: ToggleFavoriteUseCase
  ) {}

  async ngOnInit() {
    await this.loadFavorites();
  }

  async loadFavorites() {
    this.isLoading = true;
    this.error = null;
    try {
      const allVehicles = await this.getVehiclesUseCase.execute();
      const favoriteIds = FavoriteService.getFavorites();
      this.favoriteVehicles = allVehicles.filter(v => favoriteIds.includes(v.id));
    } catch (error) {
      this.error = 'Error al cargar vehículos favoritos.';
      console.error('Error loading favorites:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async toggleFavorite(vehicleId: string) {
    await this.toggleFavoriteUseCase.execute(vehicleId);
    await this.loadFavorites();
  }
}
