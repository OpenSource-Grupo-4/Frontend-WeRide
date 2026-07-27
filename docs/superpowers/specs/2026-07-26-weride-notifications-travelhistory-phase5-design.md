# Fase 5 — Notifications + Travel History: fixes reales y funcionalidad mínima nueva

**Fecha:** 2026-07-26
**Rama base:** `master` (Fases 1-4 ya mergeadas localmente)
**Alcance:** Corregir 2 llamadas HTTP rotas en `NotificationsApiEndpoint` contra el backend real, y construir el wiring mínimo (sin pantalla ni ruta nueva) para que Travel History deje de ser una funcionalidad inexistente en el frontend.

## Contexto

Se verificó el shape y comportamiento real leyendo el código fuente de `Backend-WeRide` (controllers, resources), no solo el PDF de handoff — el PDF quedó desactualizado respecto a un endpoint de Notifications que sí existe hoy en el código.

**Notifications** (`NotificationsController`, `/api/v1/notifications`):
- `POST /notifications` — crea, ignora el resultado real de guardado y siempre devuelve 201 (el shape de `CreateNotificationResource` coincide con `NotificationResponse` del frontend menos `id`/`createdAt`, que el backend genera).
- `GET /notifications` — **requiere** `@RequestParam String userId` (si falta, Spring devuelve 400); el valor se ignora, el filtrado real sale del JWT (`AuthenticatedAccountProvider`).
- `GET /notifications/{notificationId}` — devuelve la notificación si pertenece al usuario autenticado (si no, 404).
- `PATCH /notifications/{notificationId}/read` — marca como leída, sin body, devuelve un string plano ("Notification marked as read"), no un objeto `NotificationResource`.
- No existe `PUT/PATCH /notifications/{id}` genérico ni `DELETE /notifications/{id}`.

**Travel History** (`TravelHistoryController`, `/api/v1/travel-history`):
- `POST /travel-history` — crea. Body: `{userId: Long, location: String, vehicle: String, image: String, tripDuration: String, travelDistance: String}`.
- `GET /travel-history` — devuelve **todos** los registros de **todos** los usuarios (sin JWT scoping — no usa `AuthenticatedAccountProvider` en absoluto).
- `GET /travel-history/{userId}` — devuelve los registros de un usuario específico, pasado explícitamente por path param (no hay forma de que el backend lo derive solo).
- `PUT /travel-history/{id}` — actualiza un registro existente.
- Response shape (`TravelHistoryResource`): `{id: Long, userId: Long, location: String, vehicle: String, image: String, tripDuration: String, travelDistance: String, createdAt: Date}`.

Hoy Travel History no existe en absoluto en el frontend (sin componente, servicio, ni referencia en todo `src/app`).

## Cambios: Notifications

### 1. `getAll()` — falta el query param obligatorio (FIX real)

`src/app/booking/infraestructure/notifications-api-endpoint.ts` llama a `GET /notifications` sin parámetros. El backend real exige `?userId=` (aunque ignora el valor) — hoy devuelve 400. Callers en vivo: `navbar.ts`, `header.ts`, `notification-list.ts`.

**Tratamiento:** el método pasa a requerir un `userId: string` como parámetro y arma `?userId=${userId}`. Los 3 callers se actualizan para pasar el userId del usuario autenticado (vía `CurrentUserViewService`, mismo servicio ya usado en `user-history-card.ts`).

### 2. `markAsRead(id)` — URL y body incorrectos (FIX real)

Hoy: `PATCH /notifications/{id}` con body `{isRead: true, readAt: ...}`, tipado `Observable<NotificationResponse>`. Real: `PATCH /notifications/{id}/read`, sin body, devuelve un string plano.

**Tratamiento:** cambiar la URL a `/{id}/read`, eliminar el body, y cambiar el tipo de retorno a `Observable<string>`. Los 3 callers (`navbar.ts`, `header.ts`, `notification-list.ts`) no leen el valor emitido (solo usan el `next`/`error` para recargar la lista o loguear), así que no necesitan cambios más allá de la firma de tipos si TypeScript se queja.

### 3. `delete()` sin equivalente real (PENDIENTE, sin tocar)

No existe `DELETE /notifications/{id}`. Caller activo: `notification-list.ts`. Se agrega comentario `PENDIENTE backend`, comportamiento mock intacto (mismo criterio que `update()`/`delete()` de Bookings en la Fase 4).

### 4. `getByUserId`/`getById` sin callers (documentación mínima)

Ninguno tiene caller hoy. `getById` en realidad SÍ es real (`GET /notifications/{id}` existe), así que no necesita comentario de gap — se deja tal cual. `getByUserId` usa `?userId=` como filtro pero el backend real ignora ese valor igual que en `getAll()` — se documenta con un comentario breve notando que el filtrado real es por JWT, no por el valor pasado.

## Cambios: Travel History (nuevo, mínimo)

### 5. Nuevo endpoint file

`src/app/trip/infrastructure/travel-history-api-endpoint.ts` (nuevo), mismo patrón que `trips-api-endpoint.ts`:
- `getByUserId(userId: string): Observable<TravelHistoryEntry[]>` → `GET /travel-history/{userId}`.
- `create(entry: CreateTravelHistoryRequest): Observable<TravelHistoryEntry>` → `POST /travel-history`.

Nuevo modelo `src/app/trip/domain/model/travel-history.entity.ts`: `TravelHistoryEntry {id, userId, location, vehicle, image, tripDuration, travelDistance, createdAt}` y `CreateTravelHistoryRequest` (mismo shape sin `id`/`createdAt`).

Nuevo endpoint en `environment.ts`/`environment.prod.ts`: `travelHistory: '/travel-history'`.

### 6. Lectura — 3ª sección en `user-history-card`

Los tabs de `user-history-card.html` ya existen visualmente (trips/bookings) pero no están cableados — ambas secciones se muestran siempre. Se agrega una 3ª sección "Travel History" siguiendo el mismo patrón visual que las otras dos (lista + estado vacío), alimentada por `travelHistoryApi.getByUserId(userId)` en `user-history-card.ts`, mismo punto donde ya se resuelven `trips$`/`bookings$` al llegar el usuario actual.

### 7. Creación — enganchada en el fin de viaje real

`src/app/trip/presentation/views/trip-map/trip-map.ts`, método `endTrip()` (único punto real donde termina un viaje en todo el frontend hoy — ni siquiera `Trip` se persiste con `POST /trips` en ningún flujo real, confirmado en la Fase 4). Justo antes de resetear el estado local, se arma y envía el payload:

- `userId` — de `CurrentUserViewService.getCurrentUser$()` (mismo servicio ya usado en `user-history-card.ts`).
- `location` — `tripStore.currentLocation()?.name` (con fallback si es null).
- `vehicle` — `` `${vehicle.brand} ${vehicle.model}` `` desde `tripStore.currentVehicle()`.
- `image` — `vehicle.image`.
- `tripDuration` — el valor ya formateado en `elapsedTime` (string `HH:MM:SS`).
- `travelDistance` — `estimatedDistance()` formateado a string.

Si `currentVehicle()`/`currentLocation()` son null (no debería pasar durante un viaje activo, pero por seguridad), se omite la llamada y se loguea un warning — no se bloquea el flujo de fin de viaje existente (abrir el modal de calificación, resetear el store) por un fallo de esta llamada nueva.

## Fuera de alcance

- No se construye una pantalla ni ruta nueva para Travel History — se reutiliza `user-history-card`.
- No se toca `GET /travel-history` (lista global sin scoping) ni `PUT /travel-history/{id}` — no hay caller para ninguno de los dos en este alcance.
- No se resuelve el problema más amplio de que `Trip` tampoco se persiste vía `POST /trips` — mencionado como contexto, no se aborda en esta fase.
- No se cambia el formato de error de Notifications/Travel History — mismo patrón de texto plano ya establecido en fases anteriores; ninguno de los callers tocados lee el shape del error hoy.

## Testing

TDD con Karma+Jasmine, igual que fases anteriores:
- `notifications-api-endpoint.spec.ts` (nuevo): verifica que `getAll(userId)` arma `?userId=` y que `markAsRead(id)` llama a `/read` sin body.
- `travel-history-api-endpoint.spec.ts` (nuevo): verifica `getByUserId` y `create` contra las URLs reales.
- Los cambios de comentario (`PENDIENTE backend`) no requieren test nuevo.
- El cableado de `trip-map.ts`/`user-history-card.ts` no tiene specs dedicados hoy (ninguno de los dos archivos los tiene) — se sigue el mismo criterio ya usado en Fases 2-4: no se agregan specs donde el propio archivo no los tenía, salvo que el cambio introduzca lógica no trivial que valga la pena aislar.
