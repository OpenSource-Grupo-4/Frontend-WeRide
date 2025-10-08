import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import { Map } from 'mapbox-gl';
import { MapComponent, MarkerComponent} from 'ngx-mapbox-gl';

@Component({
  selector: 'app-trip-map',
  imports: [MapComponent, MarkerComponent],
  templateUrl: './trip-map.html',
  styleUrl: './trip-map.css'
})
export class TripMap implements OnInit, OnDestroy {
  userLocation = signal<[number, number] | null>(null)

  private watchId?: number;

  markers = [
    {lng: -77.09451353035513, lat: -12.076631028447757},
    {lng: -77.11978877469807, lat: -12.06576550096087},
    {lng: -77.06801838656192, lat: -12.083350355463615},
    {lng: -77.07102425059432, lat: -12.071962004217465},
    {lng: -77.1073596422649, lat: -12.056230391783833}
  ]

  ngOnInit(): void {
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
