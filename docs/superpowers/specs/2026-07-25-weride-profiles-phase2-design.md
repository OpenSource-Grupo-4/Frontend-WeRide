# Fase 2: Profiles reales (WeRide)

**Fecha:** 2026-07-25
**Depende de:** Fase 1 (`docs/superpowers/plans/2026-07-24-weride-auth-phase1.md`) — JWT interceptor + login/registro real por email/password, mergeada en `master` (PR #16).
**Fuente:** `Handoff-Backend-Frontend-WeRide.pdf`, sección 7, punto 3 ("Profiles").

## Contexto

El backend real expone un `Profile` mínimo:

```
Profile { id, userId, firstName, lastName, email }
```

Solo dos endpoints: `POST /api/v1/profiles` (crea, ignora `userId` del body —
lo saca del JWT, ver `CreateProfileCommandFromResourceAssembler`) y
`GET /api/v1/profiles/{id}` (por id de perfil, no por userId; 404 si el
perfil no pertenece al usuario autenticado). No hay `PUT`. No hay
wallet/stats/seguridad/preferencias — eso corresponde a fases futuras
(Bookings, Travel History).

El módulo `user` actual del frontend (`src/app/user/**`) no tiene relación
con este backend: pega contra `/users` de json-server (mock), y **todas**
sus tarjetas de perfil (`user-personal-info-card`, `user-wallet-card`,
`user-stats`, `user-security-card`, `user-settings-card`,
`user-history-card`) leen `UserStore.getGuestUser$()`, que devuelve
`users[0]` del mock — un usuario arbitrario, sin relación con la sesión real
creada en la Fase 1. Esto es un bug preexistente que se vuelve visible ahora
que existe login real: un usuario logueado ve datos de otra persona (mock)
en su propia pantalla de perfil.

## Decisiones (confirmadas con el usuario)

- **Alcance:** solo Profiles. Vehicles/Locations/Plans, Trips, Bookings y
  Travel History/Notifications quedan para fases posteriores.
- **Creación del profile real:** se dispara automáticamente justo después de
  un registro exitoso (aprovechando el auto-login que ya hace la Fase 1 tras
  `sign-up`), usando `firstName`/`lastName`/`email` capturados en el
  formulario de registro.
- **Edición de perfil (`user-personal-info-card`):** el backend no tiene
  `PUT /profiles/{id}`. Se deja el guardado tal como está hoy (mock/local),
  marcado explícitamente en código y en este documento como **TODO
  backend: falta PUT /profiles/{id}**. No se implementa ningún workaround
  de sincronización en el frontend para esto.
- **Consulta del profile propio:** el backend no tiene `GET /profiles` por
  `userId`, solo por `id` de perfil propio. Como workaround temporal, el
  frontend guarda el `profileId` devuelto por el `POST` junto a la sesión de
  auth (extendiendo el blob de `auth_session`). Esto se documenta como
  **PENDIENTE CRÍTICO backend: falta poder resolver "mi perfil" sin guardar
  un id en el cliente** (si el usuario borra `localStorage` o cambia de
  dispositivo, se pierde la referencia — no hay endpoint de recuperación).
- **Tarjetas de wallet/stats/seguridad/settings/historial:** siguen
  100% mock (sin cambios de datos) — el único cambio es que dejan de mostrar
  un usuario mock arbitrario y pasan a reflejar al usuario realmente
  logueado (ver más abajo).

## Arquitectura

Nuevo bounded context `profile`, paralelo a `auth`, mismo patrón hexagonal
de la Fase 1 — **no se toca el módulo `user` existente** (sigue siendo el
mock legacy de `/users`, sin relación con esto; queda fuera de alcance).

```
src/app/profile/
  domain/
    model/profile.entity.ts       — { id, userId, firstName, lastName, email }
    profile.repository.ts         — abstracta: createProfile(), getProfile()
  application/
    create-profile.use-case.ts
    get-profile.use-case.ts
    profile.store.ts              — signalStore: profile, isLoading, error
  infrastructure/
    profile-repository.impl.ts    — POST/GET /api/v1/profiles, mapeo de
                                     errores texto-plano (401/404/409/500),
                                     mismo patrón que auth-repository.impl.ts
```

`environment.ts`/`environment.prod.ts`: agregar `profiles: '/profiles'` a
`endpoints` (mismo patrón que `authentication`).

### Extensión de `token-storage.ts`

Se agrega `getStoredProfileId()` y se extiende el blob guardado en
`AUTH_SESSION_KEY` con un campo opcional `profileId: number | null`. No se
crea una clave de `localStorage` separada — reutiliza el mecanismo existente
de la Fase 1.

### Flujo de creación (registro → perfil)

En `email-login.component.ts`, dentro del `effect()` que ya maneja
`justRegistered` (líneas ~39-51): cuando la sesión queda válida tras el
auto-login post-registro, además de navegar a `/home`, se dispara
`profileStore.createProfile({firstName, lastName, email})` con los valores
del formulario de registro (que el componente ya tiene en sus signals). El
`profileId` devuelto se persiste vía `token-storage.ts` junto a la sesión.
Este disparo es "fire and forget" respecto a la navegación: un fallo al
crear el perfil no debe bloquear el login (se loguea el error, no se
re-intenta automáticamente en esta fase).

Para logins normales (no registro), si la sesión ya tiene un `profileId`
guardado, `profileStore.getProfile(profileId)` se dispara al cargar la
pantalla de perfil (lazy), no en cada login.

### Arreglo del bug de identidad en la pantalla de perfil

Las 6 tarjetas de `src/app/user/presentation/views/**` que hoy leen
`UserStore.getGuestUser$()` pasan a leer una fuente combinada: el
`currentUser` de `AuthStore` (nombre/email reales de la sesión, ya
disponibles desde la Fase 1) fusionado con `firstName`/`lastName`/`email`
del `Profile` real una vez cargado por `ProfileStore`. Los campos que no
existen en el backend real (wallet, stats, seguridad, preferencias) se
siguen poblando con los mismos placeholders que ya usa `toMinimalUser` —
sin cambios de comportamiento en esos datos, solo en a quién pertenecen.

## Manejo de errores

Mismo patrón que `auth-repository.impl.ts::mapAuthError` (texto plano):
401 → sesión inválida (redirigir a login), 404 → perfil no encontrado
(tratar como "sin perfil todavía", no como error fatal — permite reintentar
`createProfile`), 409 → "ya existe un perfil" (no debería ocurrir en el
flujo normal, pero se mapea igual), resto → mensaje genérico de conexión.

## Fuera de alcance (explícito)

- `PUT /profiles/{id}` no existe — no se implementa sincronización de
  edición real (ver TODO arriba).
- Vehicles, Locations, Plans, Trips, Bookings, Travel History,
  Notifications — fases posteriores.
- Wallet, estadísticas, seguridad, preferencias reales — dependen de otros
  bounded contexts que no existen aún en el backend.
- No se toca `src/app/user/infrastructure/user-api-endpoint.ts` ni
  `UserStore` (mock `/users`) — quedan como están, sin relación con este
  cambio.

## Testing

TDD por archivo nuevo, mismo patrón que la Fase 1: specs de
`profile-repository.impl.ts` con `HttpTestingController` (asserts de
`req.request.body`, mapeo de errores 401/404/409/500), specs de
`profile.store.ts`, specs de `token-storage.ts` extendidos para
`getStoredProfileId()`, y un test en `email-login.component.spec.ts` que
verifique que `createProfile` se dispara exactamente una vez tras un
registro exitoso (no en login normal, no dos veces).
