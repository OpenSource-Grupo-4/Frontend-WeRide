import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LocationResponse } from './locations-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LocationsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.locations}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<LocationResponse[]> {
    return this.http.get<LocationResponse[]>(this.baseUrl)
      .pipe(map(items => items.map(item => this.normalize(item))));
  }

  create(location: Omit<LocationResponse, 'id'>): Observable<LocationResponse> {
    return this.http.post<LocationResponse>(this.baseUrl, location)
      .pipe(map(item => this.normalize(item)));
  }

  getById(id: string): Observable<LocationResponse> {
    return this.http.get<LocationResponse>(`${this.baseUrl}/${id}`)
      .pipe(map(item => this.normalize(item)));
  }

  update(id: string, location: Partial<LocationResponse>): Observable<LocationResponse> {
    return this.http.patch<LocationResponse>(`${this.baseUrl}/${id}`, location)
      .pipe(map(item => this.normalize(item)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private normalize(item: LocationResponse): LocationResponse {
    return { ...item, id: String((item as any).id) };
  }
}
