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
  loading: boolean;
  error: string | null;
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
    loading: false,
    error: null
  });

  trips = computed(() => this.state().trips);
  currentTrip = computed(() => this.state().currentTrip);
  currentVehicle = computed(() => this.state().currentVehicle);
  currentLocation = computed(() => this.state().currentLocation);
  locations = computed(() => this.state().locations);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);

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

  setLoading(loading: boolean) {
    this.state.update(state => ({ ...state, loading }));
  }

  setError(error: string | null) {
    this.state.update(state => ({ ...state, error }));
  }
}

