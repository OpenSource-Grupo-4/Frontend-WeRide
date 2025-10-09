import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicle } from '../domain/model/vehicle.entity';

@Injectable({
  providedIn: 'root'
})
export class VehiclesApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  getAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.baseUrl}/vehicles`);
  }

  getById(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.baseUrl}/vehicles/${id}`);
  }
}

