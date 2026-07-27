import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BookingDraft } from '../domain/model/booking-draft.entity';
import { environment } from '../../../environments/environment';

type DraftInput = Partial<BookingDraft> & {
  startLocationId?: string;
  endLocationId?: string;
  durationMinutes?: number;
};

@Injectable({ providedIn: 'root' })
export class DraftBookingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;
  private draftsSubject = new BehaviorSubject<BookingDraft[]>([]);
  drafts$ = this.draftsSubject.asObservable();

  constructor() {
    this.loadDrafts();
  }

  private loadDrafts(): void {
    this.http.get<{ content: any[] }>(`${this.apiUrl}/drafts`).pipe(
      map(response => (response.content || []).map(item => this.toDraft(item))),
      catchError(() => of([]))
    ).subscribe(drafts => this.draftsSubject.next(drafts));
  }

  saveDraft(draft: DraftInput): Observable<BookingDraft> {
    const startDate = this.futureStartDate(draft);
    const durationMinutes = Math.max(1, Number(draft.durationMinutes ?? (Number(draft.duration || 1) * 60)));
    const payload = {
      userId: null,
      vehicleId: Number(draft.vehicleId),
      startLocationId: draft.startLocationId ? Number(draft.startLocationId) : null,
      endLocationId: draft.endLocationId ? Number(draft.endLocationId) : null,
      reservedAt: new Date().toISOString(),
      startDate: startDate.toISOString(),
      endDate: new Date(startDate.getTime() + durationMinutes * 60 * 1000).toISOString(),
      actualStartDate: null,
      actualEndDate: null,
      status: 'draft',
      totalCost: 0,
      discount: 0,
      finalCost: 0,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      distance: null,
      duration: durationMinutes,
      averageSpeed: null,
      rating: null
    };

    return this.http.post<any>(`${this.apiUrl}/draft`, payload).pipe(
      map(response => this.toDraft(response)),
      tap(saved => this.draftsSubject.next([...this.draftsSubject.value, saved]))
    );
  }

  deleteDraft(draftId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/draft/${draftId}`).pipe(
      tap(() => this.draftsSubject.next(this.draftsSubject.value.filter(draft => draft.id !== draftId)))
    );
  }

  getDrafts(): BookingDraft[] {
    return this.draftsSubject.value;
  }

  private futureStartDate(draft: DraftInput): Date {
    const value = draft.selectedDate && draft.unlockTime
      ? new Date(`${draft.selectedDate}T${draft.unlockTime}`)
      : new Date(Date.now() + 60 * 60 * 1000);
    return value > new Date() ? value : new Date(Date.now() + 60 * 60 * 1000);
  }

  private toDraft(item: any): BookingDraft {
    const start = new Date(item.startDate);
    const end = item.endDate ? new Date(item.endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const draft = new BookingDraft(
      String(item.bookingId ?? item.id),
      String(item.userId ?? ''),
      String(item.vehicleId),
      this.toDateInput(start),
      this.toTimeInput(start),
      Math.max(1, Math.round(Number(item.duration || 60) / 60)),
      false,
      false,
      false,
      item.reservedAt ? new Date(item.reservedAt) : new Date(),
      end
    );
    draft.startLocationId = item.startLocationId == null ? undefined : String(item.startLocationId);
    draft.endLocationId = item.endLocationId == null ? undefined : String(item.endLocationId);
    return draft;
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toTimeInput(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }
}
