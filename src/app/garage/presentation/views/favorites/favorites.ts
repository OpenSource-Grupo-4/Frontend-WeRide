import {Component, OnInit, inject, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {VehicleCard} from '../vehicle-card/vehicle-card';
import {Vehicle} from '../../../domain/model/vehicle.model';
import {GetVehiclesUseCase} from '../../../application/use-cases/get-vehicles.usecase';
import {ToggleFavoriteUseCase} from '../../../application/use-cases/toggle-favorite.usecase';
import {FavoriteStore} from '../../../application/favorite.store';
import {AuthStore} from '../../../../auth/application/auth.store';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, VehicleCard, TranslateModule],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class Favorites implements OnInit {
  private getVehiclesUseCase = inject(GetVehiclesUseCase);
  private toggleFavoriteUseCase = inject(ToggleFavoriteUseCase);
  private favoriteStore = inject(FavoriteStore);
  private authStore = inject(AuthStore);

  favoriteVehicles: Vehicle[] = [];
  isLoading = computed(() => this.favoriteStore.isLoading());
  error = computed(() => this.favoriteStore.error());
  favorites = computed(() => this.favoriteStore.favorites());

  async ngOnInit() {
    // Load user's favorites from backend
    const currentUser = this.authStore.currentUser();
    if (currentUser) {
      this.favoriteStore.loadUserFavorites(currentUser.id);
    }
    
    // Load vehicles and filter by favorites
    await this.loadFavoriteVehicles();
  }

  async loadFavoriteVehicles() {
    try {
      const allVehicles = await this.getVehiclesUseCase.execute();
      const favoriteIds = this.favoriteStore.favoriteVehicleIds();
      
      // Filter vehicles to show only favorites and mark them
      this.favoriteVehicles = allVehicles
        .filter(v => favoriteIds.includes(v.id))
        .map(v => ({
          ...v,
          favorite: true
        }));
    } catch (error) {
      console.error('Error loading favorite vehicles:', error);
    }
  }

  async toggleFavorite(vehicleId: string) {
    const currentUser = this.authStore.currentUser();
    if (currentUser) {
      this.toggleFavoriteUseCase.execute(currentUser.id, vehicleId);
      // Wait a bit for the store to update, then reload
      setTimeout(() => this.loadFavoriteVehicles(), 300);
    }
  }

  get hasFavorites(): boolean {
    return this.favoriteVehicles.length > 0;
  }
}
