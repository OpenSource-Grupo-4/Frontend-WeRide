import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TripsResponse } from './trips-response';
import { Trip } from '../domain/model/trip.entity';

@Injectable({
  providedIn: 'root'
})
export class TripsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  getAll(): Observable<TripsResponse> {
    return this.http.get<TripsResponse>(`${this.baseUrl}/trips`);
  }

  getById(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.baseUrl}/trips/${id}`);
  }

  getByUserId(userId: string): Observable<TripsResponse> {
    return this.http.get<TripsResponse>(`${this.baseUrl}/trips?userId=${userId}`);
  }

  create(trip: Partial<Trip>): Observable<Trip> {
    return this.http.post<Trip>(`${this.baseUrl}/trips`, trip);
  }

  update(id: string, trip: Partial<Trip>): Observable<Trip> {
    return this.http.patch<Trip>(`${this.baseUrl}/trips/${id}`, trip);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/trips/${id}`);
  }
}

