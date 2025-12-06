import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocationResponse } from './locations-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LocationsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.locations}`;

  constructor(private http: HttpClient) {
    console.log('LocationsApiEndpoint - baseUrl:', this.baseUrl);
    console.log('LocationsApiEndpoint - Proxy should redirect to: http://localhost:8080' + this.baseUrl);
  }

  getAll(): Observable<LocationResponse[]> {
    console.log('Fetching locations from:', this.baseUrl);
    return this.http.get<LocationResponse[]>(this.baseUrl).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  create(location: Omit<LocationResponse, 'id'>): Observable<LocationResponse> {
    return this.http.post<LocationResponse>(this.baseUrl, location).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getById(id: string): Observable<LocationResponse> {
    return this.http.get<LocationResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  update(id: string, location: Partial<LocationResponse>): Observable<LocationResponse> {
    return this.http.patch<LocationResponse>(`${this.baseUrl}/${id}`, location).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('LocationsApiEndpoint Error:', {
      url: error.url,
      status: error.status,
      statusText: error.statusText,
      error: error.error
    });
    return throwError(() => new Error(`Error Code: ${error.status}\nMessage: ${error.message}`));
  }
}
