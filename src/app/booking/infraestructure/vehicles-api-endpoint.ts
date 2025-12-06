import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VehicleResponse, VehiclesListResponse } from './vehicle-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VehiclesApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.vehicles}`;

  constructor(private http: HttpClient) {
    console.log('VehiclesApiEndpoint - baseUrl:', this.baseUrl);
    console.log('VehiclesApiEndpoint - Proxy should redirect to: http://localhost:8080' + this.baseUrl);
  }

  getAll(): Observable<VehicleResponse[]> {
    console.log('Fetching vehicles from:', this.baseUrl);
    return this.http.get<VehicleResponse[]>(this.baseUrl).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  create(vehicle: Omit<VehicleResponse, 'id'>): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(this.baseUrl, vehicle).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getById(id: string): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  update(id: string, vehicle: Partial<VehicleResponse>): Observable<VehicleResponse> {
    return this.http.patch<VehicleResponse>(`${this.baseUrl}/${id}`, vehicle).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('VehiclesApiEndpoint Error:', {
      url: error.url,
      status: error.status,
      statusText: error.statusText,
      error: error.error
    });
    return throwError(() => new Error(`Error Code: ${error.status}\nMessage: ${error.message}`));
  }
}
