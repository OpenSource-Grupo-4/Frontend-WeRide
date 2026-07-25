import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Location } from '../domain/model/location.entity';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.locations}`;

  getAll(): Observable<Location[]> {
    return this.http.get<Location[]>(this.baseUrl);
  }

  // PENDIENTE backend: GET /location/{id} no existe en el backend real (el
  // backend real de /api/v1/location solo implementa POST y GET list).
  // Este método SÍ tiene caller en producción (TripInitializerService),
  // por lo que ese flujo fallará (404) contra el backend real hasta que
  // el backend agregue este endpoint.
  getById(id: string): Observable<Location> {
    return this.http.get<Location>(`${this.baseUrl}/${id}`);
  }
}

