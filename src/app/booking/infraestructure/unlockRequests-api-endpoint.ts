import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UnlockRequestResponse } from './unlockRequests-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UnlockRequestsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.unlockRequests}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<UnlockRequestResponse[]> {
    return this.http.get<UnlockRequestResponse[]>(this.baseUrl).pipe(map(items => items.map(item => this.normalize(item))));
  }

  getByUserId(userId: string): Observable<UnlockRequestResponse[]> {
    return this.http.get<UnlockRequestResponse[]>(`${this.baseUrl}?userId=${encodeURIComponent(userId)}`)
      .pipe(map(items => items.map(item => this.normalize(item))));
  }

  getByBookingId(bookingId: string): Observable<UnlockRequestResponse[]> {
    return this.http.get<UnlockRequestResponse[]>(`${this.baseUrl}?bookingId=${encodeURIComponent(bookingId)}`)
      .pipe(map(items => items.map(item => this.normalize(item))));
  }

  create(unlockRequest: Omit<UnlockRequestResponse, 'id' | 'userId'>): Observable<UnlockRequestResponse> {
    return this.http.post<UnlockRequestResponse>(this.baseUrl, unlockRequest).pipe(map(item => this.normalize(item)));
  }

  getById(id: string): Observable<UnlockRequestResponse> {
    return this.http.get<UnlockRequestResponse>(`${this.baseUrl}/${id}`).pipe(map(item => this.normalize(item)));
  }

  update(id: string, unlockRequest: Partial<UnlockRequestResponse>): Observable<UnlockRequestResponse> {
    return this.http.patch<UnlockRequestResponse>(`${this.baseUrl}/${id}`, unlockRequest)
      .pipe(map(item => this.normalize(item)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private normalize(item: UnlockRequestResponse): UnlockRequestResponse {
    const value = item as any;
    return { ...item, id: String(value.id), userId: String(value.userId), vehicleId: String(value.vehicleId), bookingId: String(value.bookingId) };
  }
}
