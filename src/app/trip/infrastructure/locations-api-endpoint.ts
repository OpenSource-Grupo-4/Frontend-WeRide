import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Location } from '../domain/model/location.entity';

@Injectable({
  providedIn: 'root'
})
export class LocationsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  getAll(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.baseUrl}/locations`);
  }

  getById(id: string): Observable<Location> {
    return this.http.get<Location>(`${this.baseUrl}/locations/${id}`);
  }
}

