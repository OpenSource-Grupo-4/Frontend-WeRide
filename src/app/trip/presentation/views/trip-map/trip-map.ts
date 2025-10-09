import {Component, OnDestroy, OnInit, signal, inject} from '@angular/core';
import { MapComponent, MarkerComponent} from 'ngx-mapbox-gl';
import {LocationsApiEndpoint} from '../../../infrastructure/locations-api-endpoint';
import {TripStore} from '../../../application/trip.store';

@Component({
  selector: 'app-trip-map',
  imports: [MapComponent, MarkerComponent],
  templateUrl: './trip-map.html',
  styleUrl: './trip-map.css'
})
export class TripMap implements OnInit, OnDestroy {
  private locationsApi = inject(LocationsApiEndpoint);
  private tripStore = inject(TripStore);

  userLocation = signal<[number, number] | null>(null)
  markers: Array<{lng: number, lat: number}> = [];

  private watchId?: number;

  ngOnInit(): void {
    this.loadLocations();
    this.startLocationTracking();
  }

  loadLocations() {
    this.locationsApi.getAll().subscribe({
      next: (locations: any) => {
        this.tripStore.setLocations(locations);
        this.markers = locations.map((loc: any) => ({
          lng: loc.coordinates.lng,
          lat: loc.coordinates.lat
        }));
      },
      error: (error: any) => {
        console.error('Error al cargar ubicaciones:', error);
      }
    });
  }

  startLocationTracking() {
    if('geolocation' in navigator){
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const {longitude, latitude} = pos.coords;
          this.userLocation.set([longitude, latitude]);
        },
        (error) => {
          console.log('Error Obteniendo la ubicacion', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 20000,
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalizacion')
    }
  }

  ngOnDestroy(): void {
    if(this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
    }
  }
}
