import {Component, OnDestroy, OnInit, signal, inject, computed} from '@angular/core';
import { MapComponent, MarkerComponent} from 'ngx-mapbox-gl';
import {LocationsApiEndpoint} from '../../../infrastructure/locations-api-endpoint';
import {VehiclesApiEndpoint} from '../../../infrastructure/vehicles-api-endpoint';
import {TripStore} from '../../../application/trip.store';
import {CommonModule} from '@angular/common';
import {Vehicle} from '../../../domain/model/vehicle.entity';
import {Location} from '../../../domain/model/location.entity';
import {MatDialog} from '@angular/material/dialog';
import {VehicleDetailsModal} from '../../../../garage/presentation/views/vehicle-details-modal/vehicle-details-modal';

@Component({
  selector: 'app-trip-map',
  imports: [MapComponent, MarkerComponent, CommonModule],
  templateUrl: './trip-map.html',
  styleUrl: './trip-map.css'
})
export class TripMap implements OnInit, OnDestroy {
  private locationsApi = inject(LocationsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  protected tripStore = inject(TripStore);
  private dialog = inject(MatDialog);

  userLocation = signal<[number, number] | null>(null);
  markers: Array<{lng: number, lat: number}> = [];
  vehicleMarkers = computed(() => {
    const vehicles = this.tripStore.vehicles();
    const locations = this.tripStore.locations();
    return vehicles.filter(v => v.status === 'available').map(vehicle => {
      const location = locations.find(loc => loc.id === vehicle.location);
      return {
        vehicle,
        location
      };
    }).filter(item => item.location);
  });

  nearbyVehicles = computed(() => this.tripStore.nearbyVehicles());
  selectedLocation = computed(() => this.tripStore.selectedLocation());
  connectionError = computed(() => this.tripStore.connectionError());

  private watchId?: number;
  private readonly NEARBY_DISTANCE_KM = 2;

  ngOnInit(): void {
    this.loadLocations();
    this.loadVehicles();
    this.startLocationTracking();
  }

  loadLocations() {
    this.tripStore.setLoading(true);
    this.tripStore.setConnectionError(false);
    this.locationsApi.getAll().subscribe({
      next: (locations: any) => {
        this.tripStore.setLocations(locations);
        this.markers = locations.map((loc: any) => ({
          lng: loc.coordinates.lng,
          lat: loc.coordinates.lat
        }));
        this.tripStore.setLoading(false);
      },
      error: (error: any) => {
        console.error('Error al cargar ubicaciones:', error);
        this.tripStore.setConnectionError(true);
        this.tripStore.setLoading(false);
      }
    });
  }

  loadVehicles() {
    this.tripStore.setLoading(true);
    this.tripStore.setConnectionError(false);
    this.vehiclesApi.getAll().subscribe({
      next: (vehicles: Vehicle[]) => {
        this.tripStore.setVehicles(vehicles);
        this.tripStore.setLoading(false);
      },
      error: (error: any) => {
        console.error('Error al cargar vehículos:', error);
        this.tripStore.setConnectionError(true);
        this.tripStore.setLoading(false);
      }
    });
  }

  onMapClick(event: any) {
    const lngLat = event.lngLat;
    if (lngLat) {
      const selectedLocation = { lat: lngLat.lat, lng: lngLat.lng };
      this.tripStore.setSelectedLocation(selectedLocation);
      this.findNearbyVehicles(selectedLocation);
    }
  }

  findNearbyVehicles(selectedLocation: { lat: number, lng: number }) {
    const vehicles = this.tripStore.vehicles();
    const locations = this.tripStore.locations();
    
    const nearbyVehicles = vehicles.filter(vehicle => {
      if (vehicle.status !== 'available') return false;
      
      const vehicleLocation = locations.find(loc => loc.id === vehicle.location);
      if (!vehicleLocation) return false;
      
      const distance = this.calculateDistance(
        selectedLocation.lat,
        selectedLocation.lng,
        vehicleLocation.coordinates.lat,
        vehicleLocation.coordinates.lng
      );
      
      return distance <= this.NEARBY_DISTANCE_KM;
    });

    this.tripStore.setNearbyVehicles(nearbyVehicles);
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(value: number): number {
    return value * Math.PI / 180;
  }

  getAlternativeLocations(): Location[] {
    const locations = this.tripStore.locations();
    return locations
      .filter(loc => {
        const vehiclesAtLocation = this.tripStore.vehicles().filter(
          v => v.location === loc.id && v.status === 'available'
        );
        return vehiclesAtLocation.length > 0;
      })
      .slice(0, 3);
  }

  retryLoadData() {
    this.tripStore.setConnectionError(false);
    this.loadLocations();
    this.loadVehicles();
  }

  clearSelection() {
    this.tripStore.setSelectedLocation(null);
    this.tripStore.setNearbyVehicles([]);
  }

  openVehicleDetails(vehicle: Vehicle) {
    const dialogRef = this.dialog.open(VehicleDetailsModal, {
      width: '800px',
      maxWidth: '95vw',
      data: vehicle,
      panelClass: 'vehicle-details-dialog'
    });

    dialogRef.componentInstance.dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reserve') {
        this.reserveVehicle(vehicle);
      }
    });
  }

  reserveVehicle(vehicle: Vehicle) {
    const locations = this.tripStore.locations();
    const vehicleLocation = locations.find(loc => loc.id === vehicle.location);
    
    if (vehicleLocation) {
      this.tripStore.setCurrentVehicle(vehicle);
      this.tripStore.setCurrentLocation(vehicleLocation);
      console.log('Vehículo reservado:', vehicle);
    }
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
