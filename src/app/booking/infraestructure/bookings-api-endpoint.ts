import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BookingResponse } from './bookings-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[] | { content: BookingResponse[] }>(this.baseUrl)
      .pipe(map(response => this.toList(response)));
  }

  create(booking: any): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.baseUrl, booking).pipe(map(response => this.normalize(response)));
  }

  getById(id: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/${id}`).pipe(map(response => this.normalize(response)));
  }

  update(id: string, booking: Partial<BookingResponse>): Observable<BookingResponse> {
    return this.http.patch<BookingResponse>(`${this.baseUrl}/${id}`, booking).pipe(map(response => this.normalize(response)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByUserId(userId: string): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[] | { content: BookingResponse[] }>(`${this.baseUrl}/user/${userId}`)
      .pipe(map(response => this.toList(response)));
  }

  getByVehicleId(vehicleId: string): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[] | { content: BookingResponse[] }>(`${this.baseUrl}/vehicle/${vehicleId}`)
      .pipe(map(response => this.toList(response)));
  }

  getDrafts(): Observable<BookingResponse[]> {
    return this.http.get<{ content: BookingResponse[] }>(`${this.baseUrl}/drafts`)
      .pipe(map(response => this.toList(response)));
  }

  getByStatus(status: string): Observable<BookingResponse[]> {
    return this.http.get<{ content: BookingResponse[] }>(`${this.baseUrl}/status/${status}`)
      .pipe(map(response => this.toList(response)));
  }

  getPendingByUser(userId: string): Observable<BookingResponse[]> {
    return this.http.get<{ content: BookingResponse[] }>(`${this.baseUrl}/user/${userId}/pending`)
      .pipe(map(response => this.toList(response)));
  }

  getCompletedByUser(userId: string): Observable<BookingResponse[]> {
    return this.http.get<{ content: BookingResponse[] }>(`${this.baseUrl}/user/${userId}/completed`)
      .pipe(map(response => this.toList(response)));
  }

  private toList(response: BookingResponse[] | { content: BookingResponse[] }): BookingResponse[] {
    return (Array.isArray(response) ? response : response.content || []).map(item => this.normalize(item));
  }

  private normalize(response: BookingResponse): BookingResponse {
    const item = response as any;
    return {
      ...response,
      id: String(item.id),
      bookingId: item.bookingId == null ? undefined : String(item.bookingId),
      userId: String(item.userId),
      vehicleId: String(item.vehicleId),
      startLocationId: item.startLocationId == null ? '' : String(item.startLocationId),
      endLocationId: item.endLocationId == null ? '' : String(item.endLocationId)
    };
  }
}
