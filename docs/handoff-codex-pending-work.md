# Handoff para Codex — Pendientes tras la remediación Backend↔Frontend WeRide

**Fecha:** 2026-07-27
**Contexto:** Se completaron 5 fases de remediación del frontend (Auth, Profiles, Vehicles/Locations/Plans, Trips/Bookings, Notifications/Travel History) para alinear el frontend Angular con el backend real (`Backend-WeRide`, Spring Boot), siguiendo `Handoff-Backend-Frontend-WeRide.pdf` (en el escritorio, ver ruta abajo). Todo el trabajo está en `master` de `Frontend-WeRide` y ya está pusheado a `origin/master`. Este documento lista lo que quedó pendiente.

## Rutas del proyecto (esta PC — Windows, usuario `crama`)

- **Backend real:** `C:\Users\crama\Desktop\WeRide\Backend-WeRide` (Spring Boot, Java). Fuente de verdad para shapes de request/response — se usó para verificar contra el código real, no solo contra el PDF de handoff (que quedó desactualizado en al menos un endpoint de Notifications).
- **Frontend:** `C:\Users\crama\Desktop\WeRide\Frontend-WeRide` (Angular 20, este repo). Rama `master`, ya pusheado a `origin/master` (`https://github.com/samuelbonifacio015/Frontend-WeRide.git`).
- **Documentación del proyecto:** `docs/superpowers/specs/` y `docs/superpowers/plans/` dentro de `Frontend-WeRide` — ahí están los 5 specs + 5 planes de implementación de cada fase, con el detalle completo de qué se decidió y por qué en cada una. Léase ahí primero antes de tocar cualquiera de los ítems de abajo.
- **PDF de handoff original:** `C:\Users\crama\Desktop\Handoff-Backend-Frontend-WeRide.pdf` — describe los cambios del backend (fases 0-6 de su propia remediación) y sugiere el orden de corrección del frontend. Nota: verificar siempre contra el código fuente del backend, no solo contra este PDF (ya se encontró al menos un caso donde el PDF no reflejaba un endpoint real que sí existe).
- **PR abierto:** `#16` en el repo del equipo (`OpenSource-Grupo-4/Frontend-WeRide`), rama `worktree-weride-auth-phase1` → contiene solo el trabajo de la Fase 1 (auth). Última vez que se revisó, seguía bloqueado por permisos de deploy en Vercel (alguien con rol Member+ debe autorizarlo). No se tocó en esta sesión — evaluar si conviene actualizar ese PR con todo lo que ya está en `master`, o abrir uno nuevo.

## Pendientes — endpoints reales sin equivalente en el backend (documentados con comentarios `PENDIENTE backend` en el código, sin cambiar comportamiento)

Estos requieren que el **backend** agregue el endpoint, o una decisión de producto sobre qué hacer mientras tanto:

| Módulo | Endpoint faltante | Archivo frontend afectado |
|---|---|---|
| Locations | `GET /location/{id}`, `PUT`, `DELETE` | `src/app/booking/infraestructure/locations-api-endpoint.ts` |
| Plans | `PUT /plans/{id}` | `src/app/plans/infrastructure/plans-api-endpoint.ts` |
| Trips | `GET /trips/{id}`, `PATCH/PUT /trips/{id}` | `src/app/trip/infrastructure/trips-api-endpoint.ts` |
| Bookings | `PUT/PATCH /bookings/{id}`, `DELETE /bookings/{id}` (solo existe borrar un *draft*) | `src/app/booking/infraestructure/bookings-api-endpoint.ts` |
| Notifications | `PUT/PATCH` genérico, `DELETE /notifications/{id}` | `src/app/booking/infraestructure/notifications-api-endpoint.ts` |
| Travel History | `PUT /travel-history/{id}` (existe pero sin caller) | no wireado — bajo riesgo, nadie lo necesita hoy |

## Pendientes — gaps grandes que requieren rediseño de UX, no un fix de endpoint

1. **Flujo de borrador de reservas** (`src/app/booking/application/draft-booking.service.ts`): apunta a una colección inventada (`/bookingDrafts`, estilo json-server) que no existe en el backend real. El endpoint real (`POST /api/v1/bookings/draft`) espera casi una reserva completa (vehicleId, ubicaciones, fechas, costos, pago) — muy distinto de lo que guarda el mock actual (solo preferencias: recordatorio SMS/email, fecha, duración). Migrar esto implica rediseñar el formulario de reserva.

2. **Unlock requests**: todo el sistema de "solicitud de desbloqueo" (`src/app/booking/infraestructure/unlockRequests-api-endpoint.ts` + las vistas `schedule-unlock`, `vehicle-unlock-status`, `unlock-request-list`, `qr-scanner-modal`, `manual-unlock-modal`) apunta a un concepto (`/unlockRequests`) que **no existe en absoluto** en el backend real. El desbloqueo de un vehículo, si existe en el backend, sería aparentemente solo un cambio de estado del booking — pero tampoco hay un endpoint real para eso (ver punto de Bookings arriba). Requiere definir primero cómo modela el backend el desbloqueo antes de poder migrar el frontend.

3. **`booking-form.ts`** (`src/app/booking/presentation/views/booking-form/booking.ts`, método `createNewBooking()`): manda `startLocationId: 'loc-A'`, `endLocationId: 'loc-B'` hardcodeados. El backend real espera `Long` — crear una reserva real hoy fallaría (400). No hay selector de ubicaciones reales en el formulario; construir uno es trabajo de UX nuevo.

4. **Trips nunca se persisten**: ningún flujo real llama `POST /trips` — ni siquiera después de la Fase 5 (que sí conecta `POST /travel-history` al terminar un viaje). Si se quiere que un viaje quede registrado como `Trip` en el backend (no solo como entrada de Travel History), hay que decidir dónde engancharlo — candidato natural: el mismo punto que ya usa Travel History, `src/app/trip/presentation/views/trip-map/trip-map.ts`, método `endTrip()`.

## Deuda técnica señalada, fuera de alcance de remediación

- **Duplicación arquitectónica**: existe un servicio legado (`src/app/core/services/api.service.ts`, `src/app/core/services/trip.service.ts`) que duplica llamadas HTTP ya cubiertas por los módulos hexagonales (`trip/`, `booking/`, `garage/`, etc.). Nunca se unificó — ambos caminos coexisten y algunos componentes usan uno u otro sin un criterio consistente.
- **Endpoints reales sin ningún caller en el frontend** (no es un bug, simplemente no se construyó UI para ellos — no se agregó una por decisión explícita de mantener "sin pantallas nuevas" en cada fase): `GET /bookings/status/{status}`, `GET /bookings/user/{userId}/pending`, `GET /bookings/user/{userId}/completed`, `GET /bookings/drafts`.

## Otros pendientes fuera del código

- **Fase 1, Task 7** (verificación manual end-to-end contra el backend real corriendo localmente): nunca se confirmó como hecha por el usuario. Antes de dar por cerrado el flujo de auth, correr `Backend-WeRide` localmente (`http://localhost:8080`, Swagger en `/swagger-ui.html`) y probar login/registro real desde el frontend.
- **PR #16**: ver sección de rutas arriba — decidir si se actualiza con el trabajo de las Fases 2-5 o se abre uno nuevo.

## Cómo verificar el estado actual antes de tocar cualquier ítem

1. Backend real corriendo: `cd C:\Users\crama\Desktop\WeRide\Backend-WeRide` y levantar según su propio README/Maven — confirmar shapes contra Swagger (`http://localhost:8080/swagger-ui.html`) antes de asumir nada, el código fuente puede haber cambiado desde esta sesión.
2. Frontend: `cd C:\Users\crama\Desktop\WeRide\Frontend-WeRide`, `npx ng test --watch=false --browsers=ChromeHeadless` — al cierre de esta sesión el baseline era **31 fallas preexistentes/no relacionadas, 52 SUCCESS**. Cualquier fase nueva debería mantener las 31 fallas sin cambios y sumar SUCCESS.
3. Historial completo de decisiones de cada fase: `docs/superpowers/specs/*.md` y `docs/superpowers/plans/*.md` en este mismo repo, ordenados por fecha en el nombre del archivo.
