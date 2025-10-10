import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnlockRequestResponse } from './unlockRequests-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UnlockRequestsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.unlockRequests}`;

  constructor(private http: HttpClient) {}

  // Obtener todas las solicitudes de desbloqueo
  getAll(): Observable<UnlockRequestResponse[]> {
    return this.http.get<UnlockRequestResponse[]>(this.baseUrl);
  }

  // Obtener solicitudes por ID de usuario
  getByUserId(userId: string): Observable<UnlockRequestResponse[]> {
    return this.http.get<UnlockRequestResponse[]>(`${this.baseUrl}?userId=${userId}`);
  }

  // Obtener solicitudes por ID de reserva
  getByBookingId(bookingId: string): Observable<UnlockRequestResponse[]> {
    return this.http.get<UnlockRequestResponse[]>(`${this.baseUrl}?bookingId=${bookingId}`);
  }

  // Crear una nueva solicitud de desbloqueo
  create(unlockRequest: Omit<UnlockRequestResponse, 'id'>): Observable<UnlockRequestResponse> {
    return this.http.post<UnlockRequestResponse>(this.baseUrl, unlockRequest);
  }

  // Obtener una solicitud por ID
  getById(id: string): Observable<UnlockRequestResponse> {
    return this.http.get<UnlockRequestResponse>(`${this.baseUrl}/${id}`);
  }

  // Actualizar una solicitud
  update(id: string, unlockRequest: Partial<UnlockRequestResponse>): Observable<UnlockRequestResponse> {
    return this.http.patch<UnlockRequestResponse>(`${this.baseUrl}/${id}`, unlockRequest);
  }

  // Eliminar una solicitud
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
