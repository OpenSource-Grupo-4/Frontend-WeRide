import { Injectable, signal, computed } from '@angular/core';
import { Vehicle } from '../domain/model/vehicle.entity';
import { Location } from '../domain/model/location.entity';
import {Trip} from '../domain/model/trip.entity';

interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  currentVehicle: Vehicle | null;
  currentLocation: Location | null;
  locations: Location[];
  vehicles: Vehicle[];
  nearbyVehicles: Vehicle[];
  selectedLocation: { lat: number, lng: number } | null;
  loading: boolean;
  error: string | null;
  connectionError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TripStore {
  private state = signal<TripState>({
    trips: [],
    currentTrip: null,
    currentVehicle: null,
    currentLocation: null,
    locations: [],
    vehicles: [],
    nearbyVehicles: [],
    selectedLocation: null,
    loading: false,
    error: null,
    connectionError: false
  });

  trips = computed(() => this.state().trips);
  currentTrip = computed(() => this.state().currentTrip);
  currentVehicle = computed(() => this.state().currentVehicle);
  currentLocation = computed(() => this.state().currentLocation);
  locations = computed(() => this.state().locations);
  vehicles = computed(() => this.state().vehicles);
  nearbyVehicles = computed(() => this.state().nearbyVehicles);
  selectedLocation = computed(() => this.state().selectedLocation);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  connectionError = computed(() => this.state().connectionError);

  setTrips(trips: Trip[]) {
    this.state.update(state => ({ ...state, trips }));
  }

  setCurrentTrip(trip: Trip | null) {
    this.state.update(state => ({ ...state, currentTrip: trip }));
  }

  setCurrentVehicle(vehicle: Vehicle | null) {
    this.state.update(state => ({ ...state, currentVehicle: vehicle }));
  }

  setCurrentLocation(location: Location | null) {
    this.state.update(state => ({ ...state, currentLocation: location }));
  }

  setLocations(locations: Location[]) {
    this.state.update(state => ({ ...state, locations }));
  }

  setVehicles(vehicles: Vehicle[]) {
    this.state.update(state => ({ ...state, vehicles }));
  }

  setNearbyVehicles(nearbyVehicles: Vehicle[]) {
    this.state.update(state => ({ ...state, nearbyVehicles }));
  }

  setSelectedLocation(selectedLocation: { lat: number, lng: number } | null) {
    this.state.update(state => ({ ...state, selectedLocation }));
  }

  setLoading(loading: boolean) {
    this.state.update(state => ({ ...state, loading }));
  }

  setError(error: string | null) {
    this.state.update(state => ({ ...state, error }));
  }

  setConnectionError(connectionError: boolean) {
    this.state.update(state => ({ ...state, connectionError }));
  }
}

