import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehicle } from '../../domain/models/vehicle.model';
import { VehicleCardComponent } from '../vehicle-card/vehicle-card.component';
import { GetVehiclesUseCase } from '../../application/use-cases/get-vehicles.usecase';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, VehicleCardComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  private getVehiclesUC = inject(GetVehiclesUseCase);

  vehicles: Vehicle[] = [];
  favorites: Vehicle[] = [];
  loading = false;

  async ngOnInit() {
    this.loading = true;
    this.vehicles = await this.getVehiclesUC.execute();
    this.favorites = this.vehicles.filter(v => v.favorite);
    this.loading = false;
  }
}
