import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TravelHistoryEntry, CreateTravelHistoryRequest } from '../domain/model/travel-history.entity';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TravelHistoryApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.travelHistory}`;

  // El backend real no escopea por JWT — el userId se pasa explícito.
  getByUserId(userId: string): Observable<TravelHistoryEntry[]> {
    return this.http.get<TravelHistoryEntry[]>(`${this.baseUrl}/${userId}`);
  }

  create(entry: CreateTravelHistoryRequest): Observable<TravelHistoryEntry> {
    return this.http.post<TravelHistoryEntry>(this.baseUrl, entry);
  }

  update(id: string, entry: Partial<CreateTravelHistoryRequest>): Observable<TravelHistoryEntry> {
    return this.http.put<TravelHistoryEntry>(`${this.baseUrl}/${id}`, entry);
  }
}
