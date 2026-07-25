# Fase 3: Vehicles / Locations / Plans (WeRide)

**Fecha:** 2026-07-25
**Depende de:** Fase 1 (auth real, JWT interceptor) y Fase 2 (Profiles), ambas en la rama `worktree-weride-auth-phase1` (commit `2f1405c`).
**Fuente:** `Handoff-Backend-Frontend-WeRide.pdf`, sección 7, punto 4 ("Vehicles / Locations / Plans — catálogo, sin dependencias de usuario, bajo riesgo").

## Contexto

Investigación contra el backend real (`Backend-WeRide`) y el frontend actual:

- **Vehicles** (`/api/v1/vehicles`): backend con CRUD completo (`POST`, `GET`, `GET/{id}`, `PUT/{id}`, `DELETE/{id}`), JWT requerido, **sin dueño** — cualquier usuario autenticado puede crear/editar/borrar cualquier vehículo (es catálogo puro, no hay FK a Account/Profile). El frontend (`src/app/garage/`) ya calza el shape casi exacto pero solo tiene wireado `findAll()`/`getVehicleById` — falta create/update/delete en la capa de datos.
- **Locations** (`/api/v1/location`): backend real **solo tiene `POST` (crea, devuelve body vacío) y `GET` (lista)** — no existen `GET/{id}`, `PUT` ni `DELETE`. El frontend (`booking/infraestructure/locations-api-endpoint.ts`) asume las 5 operaciones, 3 de las cuales llaman a endpoints inexistentes.
- **Plans** (`/api/v1/plans`): backend real no tiene `PUT` (no se puede editar un plan). El frontend (`plans-api-endpoint.ts`) sí expone un `update()` que llama a un PUT inexistente.
- Bug preexistente encontrado de paso: `environment.prod.ts` tiene `locations: '/locations'` (plural) mientras que `environment.ts` (dev) y el backend real usan `/location` (singular).
- Se detectaron dos componentes stub vacíos (`booking/presentation/views/vehicle-form`, `location-form`) sin lógica — no se tocan en esta fase (fuera de alcance, no relacionados con `garage/`).

## Decisiones (confirmadas con el usuario)

- **Alcance:** los 3 módulos juntos en una sola Fase 3, igual que los agrupa el handoff.
- **Vehicles:** se agrega create/update/delete a la capa de datos de `garage/` (repositorio abstracto + `VehicleApiService` + mapper + casos de uso), **sin pantallas nuevas** — no existe hoy ninguna UI de alta/edición de vehículos y no se construye una en esta fase.
- **Locations:** no se toca el CRUD del frontend. Se documenta explícitamente como **PENDIENTE backend**: faltan `GET/{id}`, `PUT`, `DELETE`, y el `POST` real no devuelve el objeto creado. Se corrige el bug de `environment.prod.ts` (`/locations` → `/location`) como fix trivial de una línea, ya que es un error de configuración objetivamente incorrecto detectado en el mismo relevamiento.
- **Plans:** no se toca el `update()` del frontend. Se documenta como **PENDIENTE backend**: no existe `PUT /plans/{id}`.
- **Fuera de alcance:** los stubs `vehicle-form`/`location-form` de `booking/`, cualquier UI de administración de flota, Trips, Bookings, Travel History, Notifications (fases futuras).

## Arquitectura — Vehicles

Se extiende `src/app/garage/` siguiendo su propio patrón existente (repositorio + casos de uso basados en `Promise`, mappers — **no** el patrón de `signalStore` que usan `auth`/`profile`, ya que este módulo tiene su propia convención establecida y no corresponde forzar la de otro módulo):

```
src/app/garage/
  application/
    repositories/vehicle.repository.ts       — MODIFICAR: agregar create/update/remove abstractos
    use-cases/create-vehicle.usecase.ts       — NUEVO
    use-cases/update-vehicle.usecase.ts       — NUEVO
    use-cases/delete-vehicle.usecase.ts       — NUEVO
  infrastructure/
    http/vehicle-api.service.ts               — MODIFICAR: agregar createVehicle/updateVehicle/deleteVehicle
    mappers/vehicle.mapper.ts                 — MODIFICAR: agregar toApiRequest (dominio → body de creación/edición)
    repositories/vehicle.repository.impl.ts   — MODIFICAR: implementar create/update/remove
  garage.providers.ts                         — MODIFICAR: registrar los 3 casos de uso nuevos
```

Shape del body de creación/edición (`CreateVehicleResource`/`VehicleResource` reales del backend): `brand, model, year, battery, maxSpeed, range, weight, color, licensePlate, location, status, type, companyId, pricePerMinute, image, features[], maintenanceStatus, lastMaintenance, nextMaintenance, totalKilometers, rating` — mismo shape que ya usa `Vehicle`/`VehicleApiResponse` en este módulo (sin `favorite`, que es un campo derivado local, no de backend).

## Arquitectura — Locations y Plans

Sin cambios de código en el CRUD. Se agrega:
- Corrección de una línea en `environment.prod.ts` (`locations: '/location'`).
- Un comentario `// PENDIENTE backend: falta GET/{id}, PUT y DELETE en /api/v1/location; el POST real no devuelve el objeto creado` sobre los métodos de `locations-api-endpoint.ts` que llaman a endpoints inexistentes (`getById`, `update`, `delete`), sin eliminarlos ni modificarlos funcionalmente.
- Un comentario `// PENDIENTE backend: no existe PUT /plans/{id}` sobre `update()` en `plans-api-endpoint.ts`, sin eliminarlo ni modificarlo funcionalmente.

## Manejo de errores

Vehicles: mismo patrón texto-plano ya establecido en Fase 1/2 (401/404/409/500), aplicado a los 3 métodos nuevos de `VehicleApiService`/`VehicleRepositoryImpl`.

## Testing

`garage/infrastructure` no tiene specs hoy (solo smoke tests de presentación). El código nuevo (HTTP + mapeo, lógica no trivial) sí lleva TDD con `HttpTestingController`, siguiendo el mismo patrón de test usado en `auth`/`profile` para las llamadas HTTP reales.

## Fuera de alcance (explícito)

- Pantallas de administración de vehículos (crear/editar/borrar desde la UI).
- Cualquier cambio funcional a Locations o Plans más allá del fix de una línea y los comentarios PENDIENTE backend.
- Stubs `vehicle-form`/`location-form` de `booking/`.
- Trips, Bookings, Travel History, Notifications (fases futuras).
