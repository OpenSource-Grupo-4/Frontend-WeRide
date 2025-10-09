import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocationResponse, LocationsListResponse } from './locations-response';

@Injectable({ providedIn: 'root' })
export class LocationsApiEndpoint {
  private baseUrl = 'http://localhost:3000/locations';

  constructor(private http: HttpClient) {}

  // Obtener todas las ubicaciones
  getAll(): Observable<LocationResponse[]> {
    return this.http.get<LocationResponse[]>(this.baseUrl);
  }

  // Crear una nueva ubicación
  create(location: Omit<LocationResponse, 'id'>): Observable<LocationResponse> {
    return this.http.post<LocationResponse>(this.baseUrl, location);
  }

  // Obtener una ubicación por ID
  getById(id: string): Observable<LocationResponse> {
    return this.http.get<LocationResponse>(`${this.baseUrl}/${id}`);
  }

  // Actualizar una ubicación
  update(id: string, location: Partial<LocationResponse>): Observable<LocationResponse> {
    return this.http.patch<LocationResponse>(`${this.baseUrl}/${id}`, location);
  }

  // Eliminar una ubicación
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
