import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { VehicleResponse, VehiclesListResponse } from './vehicle-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VehiclesApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.vehicles}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(this.baseUrl)
      .pipe(map(items => items.map(item => this.normalize(item))));
  }

  create(vehicle: Omit<VehicleResponse, 'id'>): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(this.baseUrl, vehicle)
      .pipe(map(item => this.normalize(item)));
  }

  getById(id: string): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.baseUrl}/${id}`)
      .pipe(map(item => this.normalize(item)));
  }

  update(id: string, vehicle: Partial<VehicleResponse>): Observable<VehicleResponse> {
    return this.http.patch<VehicleResponse>(`${this.baseUrl}/${id}`, vehicle)
      .pipe(map(item => this.normalize(item)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // El backend real emite los ids de vehículos como números; se normalizan a
  // string para que las comparaciones del frontend (=== contra selectedVehicle,
  // que Angular stringifica desde el <option>) sean consistentes. Si la
  // respuesta no trae id (204, body inesperado), se normaliza a '' para que el
  // fallo sea visible en la UI en vez de producir un "undefined" silencioso.
  private normalize(item: VehicleResponse): VehicleResponse {
    const value = item as any;
    return { ...item, id: value.id == null ? '' : String(value.id) };
  }
}
