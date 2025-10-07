import { Component } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-trip-details',
  imports: [
    MatCard,
    MatButton,
    CommonModule
  ],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css'
})
export class TripDetails {
  location = 'Av.Arequipa 1250 (Miraflores)';
  battery = 85;
  remainingTime = '07:45 min';
  extraTime = 'Aun no sobrepasas tu tiempo';
  rating = 0;

  setRating(stars: number) {
    this.rating = stars;
  }

  goToHistory() {
    /**
     * TODO: Implementar la lógica de navegación a la pantalla de historial de viajes
     */
  }

  goToSettings() {
    /**
     * TODO: Implementar la lógica de navegación a la pantalla de configuración
     */
  }
}
