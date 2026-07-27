import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Location } from '../domain/model/location.entity';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LocationsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.locations}`;

  getAll(): Observable<Location[]> {
    return this.http.get<Location[]>(this.baseUrl)
      .pipe(map(items => items.map(item => ({ ...item, id: String((item as any).id) }))));
  }

  getById(id: string): Observable<Location> {
    return this.http.get<Location>(`${this.baseUrl}/${id}`)
      .pipe(map(item => ({ ...item, id: String((item as any).id) })));
  }
}
