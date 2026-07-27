# WeRide Notifications/Travel History (Fase 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir 2 llamadas HTTP rotas de `NotificationsApiEndpoint` contra el backend real (`GET /notifications` sin el query param obligatorio, `markAsRead` con URL/body incorrectos), documentar el resto de gaps sin equivalente real, y construir el wiring mínimo (sin pantalla ni ruta nueva) para que Travel History deje de ser inexistente en el frontend: lectura en la tarjeta de historial ya existente, creación enganchada en el único punto real donde termina un viaje hoy.

**Architecture:** Fixes quirúrgicos dentro de `notifications-api-endpoint.ts` (mismo patrón plano ya usado en `bookings-api-endpoint.ts`/`trips-api-endpoint.ts`, sin capa de repositorio nueva). Travel History se agrega como un endpoint file nuevo bajo `trip/infrastructure/` (mismo patrón que `trips-api-endpoint.ts`), sin arquitectura hexagonal adicional — este módulo nunca la tuvo.

**Tech Stack:** Angular 20, RxJS/`HttpClient`, `@ngrx/signals` (`AuthStore`, ya existente), Karma + Jasmine (`ng test`), `HttpClientTestingModule`/`HttpTestingController`.

## Global Constraints

- Trabajo directo sobre `master` (Fases 1-4 ya mergeadas localmente). No hay worktree activo para esta fase — se ejecuta en el repo principal.
- Backend real de Notifications (`NotificationsController`, `/api/v1/notifications`): `GET /notifications` **requiere** `@RequestParam String userId` (400 si falta, el valor se ignora — el filtrado real sale del JWT). `PATCH /notifications/{id}/read` marca como leída, **sin body**, devuelve un string plano. No existe `PUT/PATCH /notifications/{id}` genérico ni `DELETE /notifications/{id}`. `GET /notifications/{id}` sí existe y no tiene gap.
- Backend real de Travel History (`TravelHistoryController`, `/api/v1/travel-history`): `POST /travel-history` body `{userId: Long, location: String, vehicle: String, image: String, tripDuration: String, travelDistance: String}`. `GET /travel-history/{userId}` — **no hay scoping por JWT**, el `userId` se pasa explícito por path param. Response (`TravelHistoryResource`): `{id, userId, location, vehicle, image, tripDuration, travelDistance, createdAt}` — todos los campos excepto `id`/`createdAt` son `String` (o `Long` para `userId`).
- `AuthStore` (`src/app/auth/application/auth.store.ts`) expone `currentUser: Signal<User | null>` vía `@ngrx/signals`; `User.id` es `string`.
- No se construye ruta ni componente nuevo para Travel History — se reutiliza la 3ª sección de tabs ya presente visualmente (pero no cableada) en `user-history-card.html`.
- No se toca `GET /travel-history` (lista global sin scoping) ni `PUT /travel-history/{id}` — sin caller en este alcance.
- No se resuelve que `Trip` tampoco se persiste vía `POST /trips` — fuera de alcance, mencionado solo como contexto.
- Ver spec completo: `docs/superpowers/specs/2026-07-26-weride-notifications-travelhistory-phase5-design.md`.

---

### Task 1: Notifications — `getAll(userId)` con el query param real

**Files:**
- Modify: `src/app/booking/infraestructure/notifications-api-endpoint.ts`
- Modify: `src/app/public/components/navbar/navbar.ts`
- Modify: `src/app/public/components/header/header.ts`
- Modify: `src/app/booking/presentation/views/notification-list/notification-list.ts`
- Test: `src/app/booking/infraestructure/notifications-api-endpoint.spec.ts` (nuevo)

**Interfaces:**
- Produces: `NotificationsApiEndpoint.getAll(userId: string): Observable<NotificationResponse[]>` (firma cambiada, ahora requiere `userId`) — consumido en este mismo task por los 3 callers.

- [ ] **Step 1: Escribir el test que falla**

```typescript
// src/app/booking/infraestructure/notifications-api-endpoint.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationsApiEndpoint } from './notifications-api-endpoint';
import { NotificationResponse } from './notifications-response';
import { environment } from '../../../environments/environment';

describe('NotificationsApiEndpoint', () => {
  let service: NotificationsApiEndpoint;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.notifications}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationsApiEndpoint, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(NotificationsApiEndpoint);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll(userId) manda el query param obligatorio que exige el backend real', () => {
    const mockNotifications: NotificationResponse[] = [];
    service.getAll('42').subscribe(n => expect(n).toEqual(mockNotifications));

    const req = httpMock.expectOne(`${baseUrl}?userId=42`);
    expect(req.request.method).toBe('GET');
    req.flush(mockNotifications);
  });

  it('markAsRead(id) llama a PATCH /notifications/{id}/read sin body', () => {
    service.markAsRead('n1').subscribe(result => expect(result).toBe('Notification marked as read'));

    const req = httpMock.expectOne(`${baseUrl}/n1/read`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush('Notification marked as read');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/notifications-api-endpoint.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `getAll` hoy no acepta parámetros y llama a `baseUrl` sin query; `markAsRead` hoy llama a `${baseUrl}/n1` (sin `/read`) con body.

- [ ] **Step 3: Corregir `getAll` y `markAsRead` en `notifications-api-endpoint.ts`**

```typescript
// src/app/booking/infraestructure/notifications-api-endpoint.ts — reemplazar ambos métodos existentes
  // Obtener todas las notificaciones del usuario autenticado.
  // El backend real exige el query param (400 si falta) aunque ignora su
  // valor — el filtrado real sale del JWT.
  getAll(userId: string): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}?userId=${userId}`);
  }
```

```typescript
  // Marcar una notificación como leída.
  // El backend real es PATCH /notifications/{id}/read, sin body, y
  // devuelve un string plano (no un NotificationResource).
  markAsRead(id: string): Observable<string> {
    return this.http.patch<string>(`${this.baseUrl}/${id}/read`, null);
  }
```

- [ ] **Step 4: Actualizar el caller en `navbar.ts`**

```typescript
// src/app/public/components/navbar/navbar.ts — agregar el import y la inyección
import { AuthStore } from '../../../auth/application/auth.store';
```

```typescript
  private authStore = inject(AuthStore);
```

```typescript
  // src/app/public/components/navbar/navbar.ts — reemplazar loadNotifications()
  loadNotifications() {
    const userId = this.authStore.currentUser()?.id;
    if (!userId) return;

    this.notificationsApi.getAll(userId).subscribe({
      next: (responses: NotificationResponse[]) => {
        const notificationList = responses.map(r => toDomainNotification(r));
        const sortedNotifications = notificationList
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10);
        this.notifications.set(sortedNotifications);
      }
    });
  }
```

- [ ] **Step 5: Actualizar el caller en `header.ts`**

```typescript
// src/app/public/components/header/header.ts — agregar el import y la inyección
import { AuthStore } from '../../../auth/application/auth.store';
```

```typescript
  private authStore = inject(AuthStore);
```

```typescript
  // src/app/public/components/header/header.ts — reemplazar loadNotifications()
  loadNotifications() {
    const userId = this.authStore.currentUser()?.id;
    if (!userId) return;

    this.notificationsApi.getAll(userId).subscribe({
      next: (responses: NotificationResponse[]) => {
        const notificationList = responses.map(r => toDomainNotification(r));
        const sortedNotifications = notificationList
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10);
        this.notifications.set(sortedNotifications);
      }
    });
  }
```

- [ ] **Step 6: Actualizar el caller en `notification-list.ts`**

```typescript
// src/app/booking/presentation/views/notification-list/notification-list.ts — agregar el import y la inyección
import { AuthStore } from '../../../../auth/application/auth.store';
```

```typescript
  private authStore = inject(AuthStore);
```

```typescript
  // src/app/booking/presentation/views/notification-list/notification-list.ts — reemplazar loadNotifications()
  loadNotifications(): void {
    const userId = this.authStore.currentUser()?.id;
    if (!userId) {
      this.isLoading = false;
      return;
    }

    this.notificationsApi.getAll(userId).subscribe({
      next: (notifications) => {
        this.notifications = notifications.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.unreadCount = notifications.filter(n => !n.isRead).length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }
```

- [ ] **Step 7: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/notifications-api-endpoint.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS (2 specs)

- [ ] **Step 8: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 9: Commit**

```bash
git add src/app/booking/infraestructure/notifications-api-endpoint.ts src/app/booking/infraestructure/notifications-api-endpoint.spec.ts src/app/public/components/navbar/navbar.ts src/app/public/components/header/header.ts src/app/booking/presentation/views/notification-list/notification-list.ts
git commit -m "fix(notifications): send required userId param and fix markAsRead URL/body"
```

---

### Task 2: Notifications — documentar `delete`/`getByUserId`/`getById` sin equivalente real o sin caller

**Files:**
- Modify: `src/app/booking/infraestructure/notifications-api-endpoint.ts`

**Interfaces:**
- Ninguna — documentación aislada. `delete()` mantiene su comportamiento actual (sigue siendo llamado desde `notification-list.ts`, sin cambios funcionales). `getByUserId`/`getById` no tienen callers.

- [ ] **Step 1: Agregar comentarios sobre `delete`, `getByUserId` y `getById`**

```typescript
// src/app/booking/infraestructure/notifications-api-endpoint.ts — el archivo completo queda así
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationResponse } from './notifications-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.notifications}`;

  constructor(private http: HttpClient) {}

  // Obtener todas las notificaciones del usuario autenticado.
  // El backend real exige el query param (400 si falta) aunque ignora su
  // valor — el filtrado real sale del JWT.
  getAll(userId: string): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}?userId=${userId}`);
  }

  // PENDIENTE backend: este filtro por query param no tiene efecto real
  // — GET /notifications ya filtra por JWT sin importar el valor de
  // userId, igual que getAll(). Sin callers hoy.
  getByUserId(userId: string): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}?userId=${userId}`);
  }

  // Crear una nueva notificación
  create(notification: Omit<NotificationResponse, 'id'>): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(this.baseUrl, notification);
  }

  // GET /notifications/{id} sí existe en el backend real (devuelve 404 si
  // no pertenece al usuario autenticado) — sin callers hoy, pero no hay
  // gap que documentar.
  getById(id: string): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.baseUrl}/${id}`);
  }

  // PENDIENTE backend: no existe PUT/PATCH /notifications/{id} genérico
  // en el backend real (fuera de /read, ver markAsRead). Sin callers hoy.
  update(id: string, notification: Partial<NotificationResponse>): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.baseUrl}/${id}`, notification);
  }

  // PENDIENTE backend: no existe DELETE /notifications/{id} en el
  // backend real. Caller: notification-list.ts (eliminar notificación) —
  // hoy fallará con 404/405 contra el backend real.
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Marcar una notificación como leída.
  // El backend real es PATCH /notifications/{id}/read, sin body, y
  // devuelve un string plano (no un NotificationResource).
  markAsRead(id: string): Observable<string> {
    return this.http.patch<string>(`${this.baseUrl}/${id}/read`, null);
  }
}
```

- [ ] **Step 2: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/app/booking/infraestructure/notifications-api-endpoint.ts
git commit -m "docs(notifications): document missing DELETE/PATCH endpoints and dead getByUserId filter"
```

---

### Task 3: Travel History — endpoint file, modelo de dominio y config de ambiente

**Files:**
- Create: `src/app/trip/domain/model/travel-history.entity.ts`
- Create: `src/app/trip/infrastructure/travel-history-api-endpoint.ts`
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.prod.ts`
- Test: `src/app/trip/infrastructure/travel-history-api-endpoint.spec.ts` (nuevo)

**Interfaces:**
- Produces: `TravelHistoryEntry {id, userId, location, vehicle, image, tripDuration, travelDistance, createdAt}`, `CreateTravelHistoryRequest {userId, location, vehicle, image, tripDuration, travelDistance}`, `TravelHistoryApiEndpoint.getByUserId(userId: string): Observable<TravelHistoryEntry[]>`, `create(entry: CreateTravelHistoryRequest): Observable<TravelHistoryEntry>` — consumidos por [[Task 4]] y [[Task 5]].

- [ ] **Step 1: Crear el modelo de dominio**

```typescript
// src/app/trip/domain/model/travel-history.entity.ts
export interface TravelHistoryEntry {
  id: string;
  userId: string;
  location: string;
  vehicle: string;
  image: string;
  tripDuration: string;
  travelDistance: string;
  createdAt: string;
}

export interface CreateTravelHistoryRequest {
  userId: string;
  location: string;
  vehicle: string;
  image: string;
  tripDuration: string;
  travelDistance: string;
}
```

- [ ] **Step 2: Agregar el endpoint a los archivos de ambiente**

```typescript
// src/environments/environment.ts — agregar dentro de "endpoints"
    travelHistory: '/travel-history',
```

```typescript
// src/environments/environment.prod.ts — agregar dentro de "endpoints"
    travelHistory: '/travel-history',
```

- [ ] **Step 3: Escribir el test que falla**

```typescript
// src/app/trip/infrastructure/travel-history-api-endpoint.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TravelHistoryApiEndpoint } from './travel-history-api-endpoint';
import { TravelHistoryEntry, CreateTravelHistoryRequest } from '../domain/model/travel-history.entity';
import { environment } from '../../../environments/environment';

describe('TravelHistoryApiEndpoint', () => {
  let service: TravelHistoryApiEndpoint;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.travelHistory}`;

  const entry: TravelHistoryEntry = {
    id: '1', userId: '42', location: 'Miraflores', vehicle: 'Xiaomi Pro 2',
    image: 'scooter.png', tripDuration: '00:15:00', travelDistance: '2.30',
    createdAt: '2026-07-26T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TravelHistoryApiEndpoint, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TravelHistoryApiEndpoint);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getByUserId llama a GET /travel-history/{userId}', () => {
    service.getByUserId('42').subscribe(entries => expect(entries).toEqual([entry]));

    const req = httpMock.expectOne(`${baseUrl}/42`);
    expect(req.request.method).toBe('GET');
    req.flush([entry]);
  });

  it('create llama a POST /travel-history con el body completo', () => {
    const request: CreateTravelHistoryRequest = {
      userId: '42', location: 'Miraflores', vehicle: 'Xiaomi Pro 2',
      image: 'scooter.png', tripDuration: '00:15:00', travelDistance: '2.30'
    };

    service.create(request).subscribe(result => expect(result).toEqual(entry));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(entry);
  });
});
```

- [ ] **Step 4: Correr el test y verificar que falla**

Run: `npx ng test --include='**/travel-history-api-endpoint.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `TravelHistoryApiEndpoint` no existe todavía.

- [ ] **Step 5: Crear `travel-history-api-endpoint.ts`**

```typescript
// src/app/trip/infrastructure/travel-history-api-endpoint.ts
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
}
```

- [ ] **Step 6: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/travel-history-api-endpoint.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS (2 specs)

- [ ] **Step 7: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 8: Commit**

```bash
git add src/app/trip/domain/model/travel-history.entity.ts src/app/trip/infrastructure/travel-history-api-endpoint.ts src/app/trip/infrastructure/travel-history-api-endpoint.spec.ts src/environments/environment.ts src/environments/environment.prod.ts
git commit -m "feat(trip): add TravelHistoryApiEndpoint (GET/{userId}, POST) against the real backend"
```

---

### Task 4: Travel History — lectura en `user-history-card` (3ª sección)

**Files:**
- Modify: `src/app/user/presentation/views/user-history-card/user-history-card.ts`
- Modify: `src/app/user/presentation/views/user-history-card/user-history-card.html`
- Modify: `src/app/user/presentation/views/user-history-card/user-history-card.css`
- Modify: `src/assets/i18n/es.json`
- Modify: `src/assets/i18n/en.json`

**Interfaces:**
- Consumes: `TravelHistoryApiEndpoint.getByUserId` de [[Task 3]].

- [ ] **Step 1: Agregar las claves de traducción**

```json
// src/assets/i18n/es.json — dentro del bloque "history", después de "bookingId"
      "bookingId": "Reserva #",
      "travelHistory": "Historial de Viajes",
      "noTravelHistory": "No hay historial de viajes registrado"
```

```json
// src/assets/i18n/en.json — dentro del bloque "history", después de "bookingId"
      "bookingId": "Booking #",
      "travelHistory": "Travel History",
      "noTravelHistory": "No travel history registered"
```

- [ ] **Step 2: Cablear `travelHistory$` en `user-history-card.ts`**

```typescript
// src/app/user/presentation/views/user-history-card/user-history-card.ts — reemplazar el archivo completo
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
import { TripsApiEndpoint } from '../../../../trip/infrastructure/trips-api-endpoint';
import { BookingsApiEndpoint } from '../../../../booking/infraestructure/bookings-api-endpoint';
import { TravelHistoryApiEndpoint } from '../../../../trip/infrastructure/travel-history-api-endpoint';
import { TravelHistoryEntry } from '../../../../trip/domain/model/travel-history.entity';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-history-card',
  standalone: true,
  imports: [CommonModule, MatIcon, TranslateModule],
  templateUrl: './user-history-card.html',
  styleUrl: './user-history-card.css'
})
export class UserHistoryCard implements OnInit {
  private readonly currentUserView = inject(CurrentUserViewService);
  private readonly tripsApi = inject(TripsApiEndpoint);
  private readonly bookingsApi = inject(BookingsApiEndpoint);
  private readonly travelHistoryApi = inject(TravelHistoryApiEndpoint);
  private readonly stateService = inject(UserSettingsStateService);

  user$ = this.currentUserView.getCurrentUser$();
  trips$: Observable<any[]> = new Observable(observer => observer.next([]));
  bookings$: Observable<any[]> = new Observable(observer => observer.next([]));
  travelHistory$: Observable<TravelHistoryEntry[]> = new Observable(observer => observer.next([]));

  ngOnInit(): void {
    this.user$.subscribe(user => {
      if (user?.id) {
        this.trips$ = this.tripsApi.getMine();
        this.bookings$ = this.bookingsApi.getByUserId(user.id.toString());
        this.travelHistory$ = this.travelHistoryApi.getByUserId(user.id.toString());
      } else {
        this.trips$ = new Observable(observer => observer.next([]));
        this.bookings$ = new Observable(observer => observer.next([]));
        this.travelHistory$ = new Observable(observer => observer.next([]));
      }
    });
  }

  closeCard(): void {
    this.stateService.closeSection();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'completed': '#10b981',
      'pending': '#f59e0b',
      'cancelled': '#ef4444',
      'in_progress': '#3b82f6'
    };
    return colors[status] || '#6b7280';
  }
}
```

- [ ] **Step 3: Agregar la sección al template**

```html
<!-- src/app/user/presentation/views/user-history-card/user-history-card.html — agregar después de </div> que cierra "bookings-section" (antes de </ng-container>) -->
      <div class="travel-history-section">
        <h3>{{ 'user.history.travelHistory' | translate }}</h3>
        <div class="travel-history-list" *ngIf="travelHistory$ | async as entries">
          <div *ngIf="entries.length === 0" class="empty-state">
            <p>{{ 'user.history.noTravelHistory' | translate }}</p>
          </div>
          <div *ngFor="let entry of entries" class="travel-history-item">
            <div class="trip-icon">
              <mat-icon>history</mat-icon>
            </div>
            <div class="trip-info">
              <div class="trip-route">{{ entry.vehicle }} — {{ entry.location }}</div>
              <div class="trip-details">
                <span>{{ formatDate(entry.createdAt) }}</span>
                <span>{{ entry.tripDuration }}</span>
                <span>{{ entry.travelDistance }} km</span>
              </div>
            </div>
          </div>
        </div>
      </div>
```

- [ ] **Step 4: Reutilizar las reglas CSS existentes para la sección nueva**

```css
/* src/app/user/presentation/views/user-history-card/user-history-card.css — extender los selectores existentes con .travel-history-section/.travel-history-item */
.trips-section h3,
.bookings-section h3,
.travel-history-section h3 {
```

```css
.trips-list,
.bookings-list,
.travel-history-list {
```

```css
.trip-item,
.booking-item,
.travel-history-item {
```

```css
.trip-item:hover,
.booking-item:hover,
.travel-history-item:hover {
```

```css
.trip-info,
.booking-info {
```

(este último selector ya cubre `.trip-info`, reutilizado tal cual en el nuevo bloque HTML — no necesita cambio)

```css
@media (max-width: 768px) {
  .history-card {
    padding: 1rem;
  }

  .trip-item,
  .booking-item,
  .travel-history-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

- [ ] **Step 5: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/app/user/presentation/views/user-history-card/user-history-card.ts src/app/user/presentation/views/user-history-card/user-history-card.html src/app/user/presentation/views/user-history-card/user-history-card.css src/assets/i18n/es.json src/assets/i18n/en.json
git commit -m "feat(user): show Travel History as a 3rd section in user-history-card"
```

---

### Task 5: Travel History — creación al terminar un viaje real

**Files:**
- Modify: `src/app/trip/presentation/views/trip-map/trip-map.ts`

**Interfaces:**
- Consumes: `TravelHistoryApiEndpoint.create` de [[Task 3]]; `CurrentUserViewService.getCurrentUser$()` (ya existente, usado en `user-history-card.ts`).

- [ ] **Step 1: Agregar los imports y la inyección de servicios**

```typescript
// src/app/trip/presentation/views/trip-map/trip-map.ts — agregar a los imports existentes
import { TravelHistoryApiEndpoint } from '../../../infrastructure/travel-history-api-endpoint';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
import { firstValueFrom } from 'rxjs';
```

```typescript
  // src/app/trip/presentation/views/trip-map/trip-map.ts — agregar junto a los demás "inject(...)" de la clase
  private travelHistoryApi = inject(TravelHistoryApiEndpoint);
  private currentUserView = inject(CurrentUserViewService);
```

- [ ] **Step 2: Enganchar la creación en `endTrip()`**

```typescript
  // src/app/trip/presentation/views/trip-map/trip-map.ts — reemplazar el método endTrip() existente
  endTrip() {
    const currentTrip = this.tripStore.currentTrip();

    this.saveTravelHistoryEntry();

    // Open rate trip modal after ending trip
    this.openRateTripModal();

    // End the trip in store
    this.tripStore.endTrip();
    this.elapsedTime.set('00:00:00');
    this.remainingTime.set('00:00:00');
    this.currentBattery.set(0);
    this.estimatedDistance.set(0);
  }

  // No bloquea el flujo de fin de viaje si falla — el rating y el reset
  // del store deben ocurrir igual.
  private async saveTravelHistoryEntry(): Promise<void> {
    const vehicle = this.tripStore.currentVehicle();
    const location = this.tripStore.currentLocation();

    if (!vehicle || !location) {
      console.warn('No se pudo registrar el historial de viaje: falta vehículo o ubicación actual');
      return;
    }

    const user = await firstValueFrom(this.currentUserView.getCurrentUser$());
    if (!user?.id) {
      console.warn('No se pudo registrar el historial de viaje: usuario no autenticado');
      return;
    }

    try {
      await firstValueFrom(this.travelHistoryApi.create({
        userId: user.id.toString(),
        location: location.name,
        vehicle: `${vehicle.brand} ${vehicle.model}`,
        image: vehicle.image,
        tripDuration: this.elapsedTime(),
        travelDistance: this.estimatedDistance().toFixed(2)
      }));
    } catch (error) {
      console.error('Error registrando historial de viaje:', error);
    }
  }
```

- [ ] **Step 3: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/app/trip/presentation/views/trip-map/trip-map.ts
git commit -m "feat(trip): create a Travel History entry when a trip ends"
```

---

### Task 6: Suite completa y cierre

**Files:**
- Ninguno modificado — solo verificación.

**Interfaces:**
- Ninguna.

- [ ] **Step 1: Correr la suite completa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: mismo baseline de fallas preexistentes que al cierre de la Fase 4 (31 FAILED no relacionados), más las specs nuevas de esta fase en verde (4 nuevas: `notifications-api-endpoint.spec.ts` 2 specs + `travel-history-api-endpoint.spec.ts` 2 specs).

- [ ] **Step 2: Build de producción**

Run: `npx ng build --configuration production`
Expected: build exitoso.
