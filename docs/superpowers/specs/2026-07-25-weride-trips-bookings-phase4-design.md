# Fase 4 — Trips + Bookings: alinear frontend con el backend real

**Fecha:** 2026-07-25
**Rama:** `worktree-weride-auth-phase1` (misma rama de las Fases 1-3, PR #16 sin mergear)
**Alcance:** Corregir las llamadas HTTP de los módulos `trip` y `booking` para que coincidan con los endpoints reales del backend (`Backend-WeRide`), documentar los huecos que no tienen endpoint real equivalente, y no tocar UI/UX existente.

## Contexto

Los módulos `trip/` y `booking/` fueron escritos contra un backend mock estilo json-server (colecciones REST genéricas con filtros por query param). El backend real (`Backend-WeRide`, Spring Boot) expone un subconjunto mucho más chico y con rutas distintas para Trips y, sobre todo, para Bookings. Se verificó el shape real leyendo el código fuente de `Backend-WeRide` (controllers, resources, commands/queries), no solo el PDF de handoff, porque el PDF solo lista rutas sin payloads.

Endpoints reales confirmados:

**Trips** (`TripController`, `/api/v1/trips`):
- `POST /trips` — crea un trip para el usuario autenticado (vía JWT, `userId` del body se ignora)
- `GET /trips` — devuelve **solo los trips del usuario autenticado** (el filtrado ya lo hace el backend por JWT, no acepta query params)
- `DELETE /trips/{id}` — elimina un trip propio

No existe `GET /trips/{id}` ni `PATCH/PUT /trips/{id}`.

**Bookings** (`BookingController`, `/api/v1/bookings`):
- `POST /bookings/draft`, `GET /bookings/drafts`, `DELETE /bookings/draft/{draftId}` — flujo de borrador
- `POST /bookings`, `GET /bookings/{id}`, `GET /bookings` — CRUD básico de reserva confirmada
- `GET /bookings/vehicle/{vehicleId}`, `GET /bookings/status/{status}` — filtros por path param
- `GET /bookings/user/{userId}`, `.../pending`, `.../completed` — consultas por usuario

No existe `PUT/PATCH /bookings/{id}` ni `DELETE /bookings/{id}` (solo se puede borrar un *draft*, no una reserva confirmada).

El shape de `BookingResource`/`CreateBookingResource` del backend coincide casi campo a campo con `booking.entity.ts` del frontend — no hace falta re-mapear esa parte.

## Gaps identificados y tratamiento

### 1. Trips — `getByUserId` con query param inexistente (FIX real)

`src/app/trip/infrastructure/trips-api-endpoint.ts` tiene `getByUserId(userId)` que llama `GET /trips?userId=X`. El backend real ignora ese query param y ya devuelve solo los trips del usuario autenticado. Único caller: `user-history-card.ts`.

**Tratamiento:** reemplazar `getByUserId` por un método que llame `GET /trips` sin parámetros (el backend ya hace el scoping). Actualizar el único caller.

### 2. Trips — `getById`/`update` sin equivalente real (PENDIENTE, sin tocar)

No tienen caller en toda la app (confirmado por grep). No existe `GET /trips/{id}` ni `PATCH /trips/{id}` en el backend real.

**Tratamiento:** agregar comentario `PENDIENTE backend` arriba de cada método, sin eliminarlos (mismo criterio que Fase 3 con Locations/Plans: no se inventa un workaround para un endpoint que no existe).

### 3. Bookings — `getByUserId`/`getByVehicleId` con query params inexistentes (FIX real)

`bookings-api-endpoint.ts` tiene:
- `getByUserId(userId)` → `GET /bookings?userId=X` — debería ser `GET /bookings/user/{userId}`
- `getByVehicleId(vehicleId)` → `GET /bookings?vehicleId=X` — debería ser `GET /bookings/vehicle/{vehicleId}`

Callers: `active-booking.service.ts`, `user-history-card.ts` (`getByUserId`); `schedule-unlock.ts` (`getByVehicleId`).

**Tratamiento:** cambiar ambos métodos para usar los path params reales. La forma de la respuesta (array de `BookingResponse`) no cambia, solo la URL — los callers no necesitan cambios adicionales.

### 4. Bookings — `update()`/`delete()` sin equivalente real (PENDIENTE, sin tocar)

No existe `PATCH/PUT /bookings/{id}` ni `DELETE /bookings/{id}` en el backend real. Estos métodos sí tienen callers activos:
- `update()`: `booking.store.ts`, `booking-list.ts` (cancelar reserva), `booking-form.ts` (editar reserva), `schedule-unlock.ts` (simular desbloqueo)
- `delete()`: `booking-list.ts` (eliminar reserva)

**Tratamiento:** agregar comentario `PENDIENTE backend` en `bookings-api-endpoint.ts` arriba de `update()`/`delete()`, explicando que hoy estas llamadas fallarían contra el backend real (404/405). No se cambia el comportamiento mock ni se agregan pantallas nuevas — mismo criterio que la edición de perfil en Fase 2.

### 5. Bookings — IDs de ubicación hardcodeados en `booking-form.ts` (PENDIENTE, sin tocar)

`createNewBooking()` en `booking-form.ts` manda `startLocationId: 'loc-A'`, `endLocationId: 'loc-B'` literales. El backend real espera `Long` — estos strings harían fallar la creación de una reserva real (400). No hay selector de ubicaciones reales en el formulario de reserva; construir uno es un cambio de UX, no un simple mapeo de endpoint.

**Tratamiento:** agregar comentario `PENDIENTE backend` (o `PENDIENTE UX`) en el payload de `createNewBooking()` documentando el gap. No se construye un selector de ubicaciones nuevo — está fuera del alcance de esta fase, consistente con la decisión de no tocar UI de Locations.

### 6. Bookings — flujo de borrador (`/bookingDrafts`) y unlock-requests (`/unlockRequests`) (PENDIENTE, sin tocar)

Ya decidido con el usuario: ambos apuntan a colecciones inventadas que no existen en el backend real, y migrarlos implicaría rediseño de UX (el draft real necesita casi toda la data de una reserva; unlock-requests no tiene concepto equivalente en el backend real). Se documentan con comentarios `PENDIENTE backend` en los archivos relevantes (`draft-booking.service.ts`, `unlockRequests-api-endpoint.ts` y las vistas que dependen de ellos), sin cambiar su comportamiento mock.

### 7. `userId` en el body de creación (sin acción)

Igual que en Fase 2 con Profiles: el backend ignora `userId` del body y lo saca del JWT. Es inofensivo seguir mandándolo. No se requiere ningún cambio funcional; se puede dejar un comentario breve si el implementador lo considera útil, pero no es obligatorio.

## Fuera de alcance

- No se reescribe el flujo de borrador de reservas ni el de unlock-requests (decidido con el usuario).
- No se construye un selector de ubicaciones reales para `booking-form.ts`.
- No se tocan `GET /bookings/status/{status}`, `GET /bookings/user/{userId}/pending|completed`, `GET /bookings/drafts` — no tienen caller hoy, no se agrega uno nuevo (no se inventan pantallas).
- No se toca el servicio legado `core/services/trip.service.ts`/`api.service.ts` — ya llaman a los endpoints reales correctamente (sin filtros rotos) para lo que usan hoy (`getTrips()` sin query param).
- No se unifica la duplicación arquitectónica entre el módulo hexagonal `trip/` y el servicio legado `core/services/trip.service.ts` — es deuda técnica preexistente, no un bug funcional; fuera de foco de esta fase.

## Testing

Igual que en Fases 2/3: TDD con Karma+Jasmine. Los métodos HTTP corregidos (`getByUserId` en Trips, `getByUserId`/`getByVehicleId` en Bookings) necesitan test que verifique la URL real llamada (`HttpTestingController`). Los cambios de comentario (`PENDIENTE backend`) no requieren test nuevo.
