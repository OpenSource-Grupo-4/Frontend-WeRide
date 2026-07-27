import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Trip } from '../domain/model/trip.entity';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TripsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.trips}`;

  getById(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.baseUrl}/${id}`).pipe(map(trip => this.normalize(trip)));
  }

  getMine(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.baseUrl).pipe(map(trips => trips.map(trip => this.normalize(trip))));
  }

  create(trip: any): Observable<Trip> {
    return this.http.post<Trip>(this.baseUrl, trip).pipe(map(response => this.normalize(response)));
  }

  update(id: string, trip: Partial<Trip>): Observable<Trip> {
    return this.http.patch<Trip>(`${this.baseUrl}/${id}`, trip).pipe(map(response => this.normalize(response)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private normalize(trip: Trip): Trip {
    const value = trip as any;
    return {
      ...trip,
      id: String(value.id),
      bookingId: String(value.bookingId),
      userId: String(value.userId),
      vehicleId: String(value.vehicleId),
      startLocationId: value.startLocationId == null ? '' : String(value.startLocationId),
      endLocationId: value.endLocationId == null ? '' : String(value.endLocationId)
    };
  }
}
