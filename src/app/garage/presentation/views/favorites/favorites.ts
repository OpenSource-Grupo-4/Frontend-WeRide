import {Component, OnInit, inject, computed, signal} from '@angular/core';
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

  // Use signal for reactivity
  allVehicles = signal<Vehicle[]>([]);
  isLoading = computed(() => this.favoriteStore.isLoading());
  error = computed(() => this.favoriteStore.error());
  
  // Reactive computed property that automatically updates when favorites change
  favoriteVehicles = computed(() => {
    const favoriteIds = this.favoriteStore.favoriteVehicleIds();
    const vehicles = this.allVehicles();
    
    console.log('=== COMPUTING FAVORITE VEHICLES ===');
    console.log('Total vehicles loaded:', vehicles.length);
    console.log('Favorite IDs from store:', favoriteIds);
    console.log('Vehicle IDs:', vehicles.map(v => v.id));
    
    const filtered = vehicles.filter(v => {
      const match = favoriteIds.includes(v.id);
      if (match) {
        console.log(`✓ Vehicle ${v.id} (${v.brand} ${v.model}) is a favorite`);
      }
      return match;
    });
    
    console.log('Filtered count:', filtered.length);
    console.log('=================================');
    
    return filtered.map(v => ({
      ...v,
      favorite: true
    }));
  });

  async ngOnInit() {
    // Load user's favorites from backend
    const currentUser = this.authStore.currentUser();
    console.log('Current user:', currentUser);
    if (currentUser) {
      this.favoriteStore.loadUserFavorites(currentUser.id);
    }
    
    // Load all vehicles once
    await this.loadVehicles();
  }

  async loadVehicles() {
    try {
      const vehicles = await this.getVehiclesUseCase.execute();
      console.log('Loaded vehicles:', vehicles.length);
      this.allVehicles.set(vehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }

  async toggleFavorite(vehicleId: string) {
    const currentUser = this.authStore.currentUser();
    if (currentUser) {
      this.toggleFavoriteUseCase.execute(currentUser.id, vehicleId);
      // No need to reload - the computed signal will update automatically
    }
  }

  get hasFavorites(): boolean {
    return this.favoriteVehicles().length > 0;
  }
}

// Debug log
