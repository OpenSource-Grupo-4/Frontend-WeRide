# WeRide Trips/Bookings (Fase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir las llamadas HTTP de `trip/` y `booking/` que usan filtros de query param inexistentes en el backend real (Trips y Bookings), y documentar — sin cambiar comportamiento — las brechas que no tienen endpoint real equivalente (update/delete de bookings, IDs de ubicación hardcodeados en el formulario de reserva, flujo de borrador, unlock-requests).

**Architecture:** Cambios quirúrgicos dentro de los archivos de infraestructura existentes (`trips-api-endpoint.ts`, `bookings-api-endpoint.ts`), sin tocar la forma de las respuestas ni las firmas que consumen los callers — solo la URL/verbo HTTP que se llama internamente. No se introduce ninguna capa nueva (repositorio, mapper, use-case): estos módulos no siguen el patrón hexagonal de `garage`/`profile`, y no corresponde imponerlo en esta fase.

**Tech Stack:** Angular 20, RxJS/`HttpClient`, Karma + Jasmine (`ng test`), `HttpClientTestingModule`/`HttpTestingController`.

## Global Constraints

- Esta rama parte de `worktree-weride-auth-phase1` (Fases 1-3 ya implementadas, commit `e013b5b` con el spec de esta fase). Se trabaja directamente sobre esta rama, no se crea un worktree nuevo.
- Backend real de Trips (`TripController`, `/api/v1/trips`): `POST /trips` (crea para el usuario autenticado vía JWT), `GET /trips` (devuelve **solo** los trips del usuario autenticado — el backend ya filtra por JWT y **no acepta query params**), `DELETE /trips/{id}`. No existe `GET /trips/{id}` ni `PATCH/PUT /trips/{id}`.
- Backend real de Bookings (`BookingController`, `/api/v1/bookings`): `POST /bookings/draft`, `GET /bookings/drafts`, `DELETE /bookings/draft/{draftId}`, `POST /bookings`, `GET /bookings/{id}`, `GET /bookings`, `GET /bookings/vehicle/{vehicleId}`, `GET /bookings/status/{status}`, `GET /bookings/user/{userId}`, `GET /bookings/user/{userId}/pending`, `GET /bookings/user/{userId}/completed`. **No existe** `PUT/PATCH /bookings/{id}` ni `DELETE /bookings/{id}` (solo se puede borrar un *draft*, no una reserva confirmada).
- El shape de `BookingResponse` (`src/app/booking/infraestructure/bookings-response.ts`) ya coincide campo a campo con el `BookingResource` real del backend — no se toca.
- Fuera de alcance: reescribir el flujo de borrador de reservas (`draft-booking.service.ts` → `/bookingDrafts`) y el de unlock-requests (`unlockRequests-api-endpoint.ts` → `/unlockRequests`) — ambos apuntan a colecciones que no existen en el backend real y migrarlos implica rediseño de UX, decidido explícitamente con el usuario como PENDIENTE. Tampoco se construye un selector de ubicaciones reales para `booking-form.ts`.
- No se tocan `GET /bookings/status/{status}`, `GET /bookings/user/{userId}/pending|completed`, `GET /bookings/drafts` — no tienen caller hoy, no se agrega uno nuevo.
- No se toca `core/services/trip.service.ts` / `core/services/api.service.ts` (servicio legado) — ya llaman a `GET /trips` sin filtro roto para lo que usan hoy.
- Ver spec completo: `docs/superpowers/specs/2026-07-25-weride-trips-bookings-phase4-design.md`.

---

### Task 1: Trips — reemplazar `getByUserId` por una llamada real sin filtro

**Files:**
- Modify: `src/app/trip/infrastructure/trips-api-endpoint.ts`
- Modify: `src/app/user/presentation/views/user-history-card/user-history-card.ts:32`
- Test: `src/app/trip/infrastructure/trips-api-endpoint.spec.ts` (nuevo)

**Interfaces:**
- Produces: `TripsApiEndpoint.getMine(): Observable<Trip[]>` (reemplaza a `getByUserId(userId: string)`) — consumido por `user-history-card.ts` en este mismo task.

- [ ] **Step 1: Escribir el test que falla**

```typescript
// src/app/trip/infrastructure/trips-api-endpoint.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TripsApiEndpoint } from './trips-api-endpoint';
import { Trip } from '../domain/model/trip.entity';
import { environment } from '../../../environments/environment';

describe('TripsApiEndpoint.getMine', () => {
  let service: TripsApiEndpoint;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.trips}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TripsApiEndpoint, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TripsApiEndpoint);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('llama a GET /trips sin ningún query param (el backend ya filtra por JWT)', () => {
    const mockTrips: Trip[] = [];
    service.getMine().subscribe(trips => expect(trips).toEqual(mockTrips));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(mockTrips);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/trips-api-endpoint.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `getMine` no existe todavía en `TripsApiEndpoint`.

- [ ] **Step 3: Reemplazar `getByUserId` por `getMine` en `trips-api-endpoint.ts`**

```typescript
// src/app/trip/infrastructure/trips-api-endpoint.ts — reemplazar el método getByUserId existente
  // El backend real ya devuelve solo los trips del usuario autenticado
  // (scoping vía JWT) — no acepta filtro por userId en la URL.
  getMine(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.baseUrl);
  }
```

(elimina el método `getByUserId(userId: string)` completo, ya que su único caller se actualiza en el siguiente paso)

- [ ] **Step 4: Actualizar el caller en `user-history-card.ts`**

```typescript
// src/app/user/presentation/views/user-history-card/user-history-card.ts:32 — reemplazar la línea existente
        this.trips$ = this.tripsApi.getMine();
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/trips-api-endpoint.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS (1 spec)

- [ ] **Step 6: Commit**

```bash
git add src/app/trip/infrastructure/trips-api-endpoint.ts src/app/trip/infrastructure/trips-api-endpoint.spec.ts src/app/user/presentation/views/user-history-card/user-history-card.ts
git commit -m "fix(trips): replace getByUserId query filter with real getMine (backend scopes by JWT)"
```

---

### Task 2: Trips — documentar `getById`/`update` sin equivalente real

**Files:**
- Modify: `src/app/trip/infrastructure/trips-api-endpoint.ts`

**Interfaces:**
- Ninguna — documentación aislada, sin cambios de comportamiento. No hay callers de `getById`/`update` en toda la app (confirmado en el spec).

- [ ] **Step 1: Agregar comentarios `PENDIENTE backend` sobre `getById` y `update`**

```typescript
// src/app/trip/infrastructure/trips-api-endpoint.ts — el archivo completo queda así
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Trip } from '../domain/model/trip.entity';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TripsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.trips}`;

  getAll(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.baseUrl);
  }

  // PENDIENTE backend: no existe GET /trips/{id} en el backend real. Sin
  // callers hoy — se deja documentado en vez de eliminarlo.
  getById(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.baseUrl}/${id}`);
  }

  // El backend real ya devuelve solo los trips del usuario autenticado
  // (scoping vía JWT) — no acepta filtro por userId en la URL.
  getMine(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.baseUrl);
  }

  create(trip: Partial<Trip>): Observable<Trip> {
    return this.http.post<Trip>(this.baseUrl, trip);
  }

  // PENDIENTE backend: no existe PATCH/PUT /trips/{id} en el backend real.
  // Sin callers hoy — se deja documentado en vez de eliminarlo.
  update(id: string, trip: Partial<Trip>): Observable<Trip> {
    return this.http.patch<Trip>(`${this.baseUrl}/${id}`, trip);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

- [ ] **Step 2: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/app/trip/infrastructure/trips-api-endpoint.ts
git commit -m "docs(trips): document missing GET/{id} and PATCH endpoints on the real backend"
```

---

### Task 3: Bookings — `getByUserId`/`getByVehicleId` a path params reales

**Files:**
- Modify: `src/app/booking/infraestructure/bookings-api-endpoint.ts`
- Test: `src/app/booking/infraestructure/bookings-api-endpoint.spec.ts` (nuevo)

**Interfaces:**
- Produces: `BookingsApiEndpoint.getByUserId(userId: string): Observable<BookingResponse[]>` (misma firma, URL corregida), `getByVehicleId(vehicleId: string): Observable<BookingResponse[]>` (misma firma, URL corregida). Los callers (`active-booking.service.ts`, `user-history-card.ts`, `schedule-unlock.ts`) no cambian — siguen llamando estos mismos nombres/firmas.

- [ ] **Step 1: Escribir los tests que fallan**

```typescript
// src/app/booking/infraestructure/bookings-api-endpoint.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookingsApiEndpoint } from './bookings-api-endpoint';
import { BookingResponse } from './bookings-response';
import { environment } from '../../../environments/environment';

describe('BookingsApiEndpoint - filtros por path param real', () => {
  let service: BookingsApiEndpoint;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingsApiEndpoint, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BookingsApiEndpoint);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getByUserId llama a GET /bookings/user/{userId} (no query param)', () => {
    const mockBookings: BookingResponse[] = [];
    service.getByUserId('42').subscribe(bookings => expect(bookings).toEqual(mockBookings));

    const req = httpMock.expectOne(`${baseUrl}/user/42`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBookings);
  });

  it('getByVehicleId llama a GET /bookings/vehicle/{vehicleId} (no query param)', () => {
    const mockBookings: BookingResponse[] = [];
    service.getByVehicleId('7').subscribe(bookings => expect(bookings).toEqual(mockBookings));

    const req = httpMock.expectOne(`${baseUrl}/vehicle/7`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBookings);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/bookings-api-endpoint.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — las requests actuales van a `${baseUrl}?userId=42` / `${baseUrl}?vehicleId=7`, no a las rutas esperadas.

- [ ] **Step 3: Corregir `getByUserId` y `getByVehicleId` en `bookings-api-endpoint.ts`**

```typescript
// src/app/booking/infraestructure/bookings-api-endpoint.ts — reemplazar ambos métodos existentes
  // Obtener reservas por userId
  getByUserId(userId: string): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/user/${userId}`);
  }

  // Obtener reservas por vehicleId
  getByVehicleId(vehicleId: string): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/vehicle/${vehicleId}`);
  }
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/bookings-api-endpoint.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS (2 specs)

- [ ] **Step 5: Commit**

```bash
git add src/app/booking/infraestructure/bookings-api-endpoint.ts src/app/booking/infraestructure/bookings-api-endpoint.spec.ts
git commit -m "fix(bookings): use real path params for getByUserId/getByVehicleId"
```

---

### Task 4: Bookings — documentar `update()`/`delete()` sin equivalente real

**Files:**
- Modify: `src/app/booking/infraestructure/bookings-api-endpoint.ts`

**Interfaces:**
- Ninguna — documentación aislada, sin cambios de comportamiento. Callers existentes (`booking.store.ts`, `booking-list.ts`, `booking-form.ts`, `schedule-unlock.ts`) quedan intactos: sus llamadas a `update()`/`delete()` seguirán compilando y ejecutándose igual que hoy (fallarán con 404/405 contra el backend real, como ya ocurre).

- [ ] **Step 1: Agregar comentarios `PENDIENTE backend` sobre `update` y `delete`**

```typescript
// src/app/booking/infraestructure/bookings-api-endpoint.ts — el archivo completo queda así
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingResponse } from './bookings-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  constructor(private http: HttpClient) {}

  // Obtener todas las reservas
  getAll(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(this.baseUrl);
  }

  // Crear una nueva reserva
  create(booking: Omit<BookingResponse, 'id'>): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.baseUrl, booking);
  }

  // Obtener una reserva por ID
  getById(id: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/${id}`);
  }

  // PENDIENTE backend: no existe PUT/PATCH /bookings/{id} en el backend
  // real (solo se puede borrar un draft, no editar una reserva
  // confirmada). Callers: booking.store.ts, booking-list.ts (cancelar),
  // booking-form.ts (editar), schedule-unlock.ts (simular desbloqueo) —
  // hoy fallarán con 404/405 contra el backend real.
  update(id: string, booking: Partial<BookingResponse>): Observable<BookingResponse> {
    return this.http.patch<BookingResponse>(`${this.baseUrl}/${id}`, booking);
  }

  // PENDIENTE backend: no existe DELETE /bookings/{id} en el backend real
  // (solo DELETE /bookings/draft/{draftId} para borradores). Caller:
  // booking-list.ts (eliminar reserva) — hoy fallará con 404/405 contra
  // el backend real.
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Obtener reservas por userId
  getByUserId(userId: string): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/user/${userId}`);
  }

  // Obtener reservas por vehicleId
  getByVehicleId(vehicleId: string): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/vehicle/${vehicleId}`);
  }
}
```

- [ ] **Step 2: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/app/booking/infraestructure/bookings-api-endpoint.ts
git commit -m "docs(bookings): document missing PUT/PATCH and DELETE on the real backend"
```

---

### Task 5: Bookings — documentar IDs de ubicación hardcodeados en `booking-form.ts`

**Files:**
- Modify: `src/app/booking/presentation/views/booking-form/booking.ts:125-150`

**Interfaces:**
- Ninguna — documentación aislada, sin cambios de comportamiento ni de UI.

- [ ] **Step 1: Agregar comentario sobre el payload hardcodeado en `createNewBooking()`**

```typescript
// src/app/booking/presentation/views/booking-form/booking.ts — dentro de createNewBooking(), reemplazar el bloque del payload existente
  private createNewBooking(): void {
    const startDateTime = this.combineDateTime(this.selectedDate, this.unlockTime);
    const calculatedCost = this.calculateCost();

    // PENDIENTE backend/UX: startLocationId/endLocationId están
    // hardcodeados ('loc-A'/'loc-B') porque este formulario no tiene un
    // selector de ubicaciones reales. El backend real espera Long, así
    // que crear una reserva contra el backend real fallará (400) hasta
    // que se construya un selector — eso es un cambio de UX, fuera de
    // alcance de esta fase.
    // PAYLOAD COMPLETO (NECESARIO PARA PASAR LA VALIDACIÓN TS DEL FRONTEND)
    const payload: any = {
      userId: '1',
      vehicleId: this.selectedVehicle,
      startLocationId: 'loc-A',
      endLocationId: 'loc-B',
      reservedAt: new Date().toISOString(),
      startDate: startDateTime.toISOString(),
      endDate: new Date(startDateTime.getTime() + (this.duration * 60000)).toISOString(),
      status: 'pending',
      totalCost: calculatedCost,
      discount: 0,
      finalCost: calculatedCost,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      distance: 0,
      duration: this.duration,
      averageSpeed: 0,
      actualStartDate: null,
      actualEndDate: null,
      rating: null
    };
```

(el resto del método `createNewBooking()` queda igual, no se modifica ningún otro comportamiento)

- [ ] **Step 2: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/app/booking/presentation/views/booking-form/booking.ts
git commit -m "docs(bookings): document hardcoded location ids in booking-form payload"
```

---

### Task 6: Bookings — documentar flujo de borrador y unlock-requests como PENDIENTE

**Files:**
- Modify: `src/app/booking/application/draft-booking.service.ts`
- Modify: `src/app/booking/infraestructure/unlockRequests-api-endpoint.ts`

**Interfaces:**
- Ninguna — documentación aislada, sin cambios de comportamiento. No se tocan los 5 componentes que consumen estos dos archivos (`schedule-unlock.ts`, `vehicle-unlock-status.ts`, `unlock-request-list.ts`, `qr-scanner-modal.ts`, `manual-unlock-modal.ts`) — siguen funcionando en modo mock exactamente igual que hoy.

- [ ] **Step 1: Agregar comentario de archivo en `draft-booking.service.ts`**

```typescript
// src/app/booking/application/draft-booking.service.ts — agregar antes de la clase, después de los imports existentes
// PENDIENTE backend: este servicio guarda preferencias de reserva
// (recordatorio SMS/email, fecha, duración) contra un endpoint inventado
// (/bookingDrafts) que no existe en el backend real. El endpoint real
// (POST /api/v1/bookings/draft) espera casi una reserva completa
// (vehicleId, ubicaciones, fechas, costos, pago) — migrar este flujo
// implica rediseñar el formulario de reserva, no solo cambiar la URL.
// Se deja documentado en modo mock hasta que se aborde ese rediseño.
@Injectable({ providedIn: 'root' })
export class DraftBookingService {
```

- [ ] **Step 2: Agregar comentario de archivo en `unlockRequests-api-endpoint.ts`**

```typescript
// src/app/booking/infraestructure/unlockRequests-api-endpoint.ts — agregar antes de la clase, después de los imports existentes
// PENDIENTE backend: no existe ningún concepto de "unlock request" en el
// backend real — el desbloqueo de un vehículo no tiene un endpoint
// dedicado, es (aparentemente) solo un cambio de estado del booking. Este
// endpoint apunta a una colección inventada (/unlockRequests) que no
// existe en el backend real. Se deja documentado en modo mock; migrar
// requiere definir primero cómo modela el backend real el desbloqueo.
@Injectable({ providedIn: 'root' })
export class UnlockRequestsApiEndpoint {
```

- [ ] **Step 3: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/app/booking/application/draft-booking.service.ts src/app/booking/infraestructure/unlockRequests-api-endpoint.ts
git commit -m "docs(bookings): document draft-booking and unlock-requests backend gaps"
```

---

### Task 7: Suite completa y cierre

**Files:**
- Ninguno modificado — solo verificación.

**Interfaces:**
- Ninguna.

- [ ] **Step 1: Correr la suite completa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: mismo baseline de fallas preexistentes que al cierre de la Fase 3 (31 FAILED no relacionados), más las specs nuevas de esta fase en verde (3 nuevas: `trips-api-endpoint.spec.ts` 1 spec + `bookings-api-endpoint.spec.ts` 2 specs).

- [ ] **Step 2: Build de producción**

Run: `npx ng build --configuration production`
Expected: build exitoso.
