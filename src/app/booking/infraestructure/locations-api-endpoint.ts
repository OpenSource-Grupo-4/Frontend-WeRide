import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocationResponse } from './locations-response';
import { environment } from '../../../environments/environment';

// PENDIENTE backend: el backend real de /api/v1/location solo implementa
// POST (create) y GET (list). getById/update/delete de esta clase llaman
// a endpoints que no existen todavía — quedan aquí sin usar hasta que el
// backend los agregue. El POST real tampoco devuelve el objeto creado
// (responde 201 con body vacío), a diferencia de lo que create() asume.
@Injectable({ providedIn: 'root' })
export class LocationsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.locations}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<LocationResponse[]> {
    return this.http.get<LocationResponse[]>(this.baseUrl);
  }

  create(location: Omit<LocationResponse, 'id'>): Observable<LocationResponse> {
    return this.http.post<LocationResponse>(this.baseUrl, location);
  }

  // PENDIENTE backend: GET /location/{id} no existe en el backend real.
  getById(id: string): Observable<LocationResponse> {
    return this.http.get<LocationResponse>(`${this.baseUrl}/${id}`);
  }

  // PENDIENTE backend: PUT /location/{id} no existe en el backend real.
  update(id: string, location: Partial<LocationResponse>): Observable<LocationResponse> {
    return this.http.patch<LocationResponse>(`${this.baseUrl}/${id}`, location);
  }

  // PENDIENTE backend: DELETE /location/{id} no existe en el backend real.
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
