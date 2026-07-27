import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationResponse } from './notifications-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.notifications}`;

  constructor(private http: HttpClient) {}

  getAll(userId: string): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}?userId=${encodeURIComponent(userId)}`);
  }

  create(notification: Omit<NotificationResponse, 'id'>): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(this.baseUrl, notification);
  }

  getById(id: string): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.baseUrl}/${id}`);
  }

  update(id: string, notification: Partial<NotificationResponse>): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.baseUrl}/${id}`, notification);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  markAsRead(id: string): Observable<string> {
    return this.http.patch(`${this.baseUrl}/${id}/read`, null, { responseType: 'text' });
  }
}
