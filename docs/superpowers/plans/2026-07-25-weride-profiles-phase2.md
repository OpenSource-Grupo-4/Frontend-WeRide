# WeRide Profiles (Fase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar la pantalla de perfil de usuario al backend real de Profiles (`POST/GET /api/v1/profiles`), creando el perfil automáticamente tras el registro y mostrando la identidad real del usuario logueado en vez de un usuario mock arbitrario.

**Architecture:** Nuevo bounded context `profile` (domain/application/infrastructure), paralelo y con el mismo patrón hexagonal que `auth` (Fase 1). No se toca el módulo `user` existente salvo el cableado mínimo de sus 6 tarjetas de presentación para que lean la identidad real en vez del mock `/users`.

**Tech Stack:** Angular 20 standalone components, `@ngrx/signals` (signalStore + rxMethod), RxJS, `HttpClient`, Karma + Jasmine (`ng test`), `HttpClientTestingModule`/`HttpTestingController`.

## Global Constraints

- Esta rama parte de `worktree-weride-auth-phase1` (commit `de346ec`), NO de `master` — `master` todavía no tiene el PR #16 (Fase 1) mergeado. El worktree de esta fase debe crearse sobre esa rama/commit.
- Backend real de Profile: `Profile { id, userId, firstName, lastName, email }`. Solo existen `POST /api/v1/profiles` y `GET /api/v1/profiles/{id}` — NO existe `PUT /profiles/{id}`.
- `POST /profiles` exige un campo `userId` `@NotNull` en el body pero el backend lo **ignora completamente** (lo saca del JWT vía `AuthenticatedAccountProvider` — ver `CreateProfileCommandFromResourceAssembler`). Cualquier valor no-nulo satisface la validación; no hace falta plumbing adicional para conseguir el id de cuenta real.
- `GET /profiles/{id}` es por id de perfil propio, NO por `userId` — no existe forma de recuperarlo si se pierde el `profileId` guardado en el cliente. Esto se documenta como limitación conocida, no se resuelve en este plan.
- Errores del backend son texto plano (no JSON): 401 credenciales/token inválido, 404 no encontrado, 409 conflicto, resto = error de conexión. Mismo patrón que `AuthRepositoryImpl.mapAuthError` de la Fase 1.
- NO existe `PUT /profiles/{id}` — el guardado de "información personal" (`user-personal-info-card`) sigue siendo mock/local en esta fase, marcado explícitamente con un comentario `// TODO backend: falta PUT /profiles/{id}`.
- Fuera de alcance: Vehicles, Locations, Plans, Trips, Bookings, Travel History, Notifications (fases futuras). Wallet, estadísticas, seguridad, preferencias reales no existen en el backend — sus tarjetas siguen mostrando los mismos placeholders que ya usa `toMinimalUser` (Fase 1), solo cambia a quién pertenecen esos placeholders (el usuario real logueado, no un mock).
- No se modifica `src/app/user/infrastructure/user-api-endpoint.ts` ni el mock `/users` de json-server — quedan como están.

---

### Task 1: Modelo de dominio de Profile

**Files:**
- Create: `src/app/profile/domain/model/profile.entity.ts`
- Create: `src/app/profile/domain/profile.repository.ts`

**Interfaces:**
- Produces: `Profile { id: number, userId: number, firstName: string, lastName: string, email: string }`, `CreateProfileData { firstName: string, lastName: string, email: string }`, `abstract class ProfileRepository { createProfile(data: CreateProfileData): Observable<Profile>; getProfile(profileId: number): Observable<Profile>; }` — consumidos por [[Task 2]] (implementación) y [[Task 4]] (use-cases).

Este task no tiene lógica (solo tipos y una clase abstracta) — no aplica TDD, se escribe directo y se commitea.

- [ ] **Step 1: Crear `profile.entity.ts`**

```typescript
// src/app/profile/domain/model/profile.entity.ts
export class Profile {
  constructor(
    public id: number,
    public userId: number,
    public firstName: string,
    public lastName: string,
    public email: string
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

- [ ] **Step 2: Crear `profile.repository.ts`**

```typescript
// src/app/profile/domain/profile.repository.ts
import { Observable } from 'rxjs';
import { Profile } from './model/profile.entity';

export interface CreateProfileData {
  firstName: string;
  lastName: string;
  email: string;
}

export abstract class ProfileRepository {
  abstract createProfile(data: CreateProfileData): Observable<Profile>;
  abstract getProfile(profileId: number): Observable<Profile>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/profile/domain/model/profile.entity.ts src/app/profile/domain/profile.repository.ts
git commit -m "feat(profile): add Profile domain model and repository abstraction"
```

---

### Task 2: ProfileRepositoryImpl (HTTP real) + endpoint + provider

**Files:**
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.prod.ts`
- Create: `src/app/profile/infrastructure/profile-repository.impl.ts`
- Create: `src/app/profile/profile.providers.ts`
- Modify: `src/app/app.config.ts`
- Test: `src/app/profile/infrastructure/profile-repository.impl.spec.ts`

**Interfaces:**
- Consumes: `ProfileRepository`, `CreateProfileData`, `Profile` de [[Task 1]].
- Produces: `ProfileRepositoryImpl` (implementación DI-provista de `ProfileRepository`), `PROFILE_PROVIDERS: Provider[]` — usado por [[Task 4]] (use-cases lo inyectan vía el token abstracto `ProfileRepository`).

- [ ] **Step 1: Escribir los tests que fallan**

```typescript
// src/app/profile/infrastructure/profile-repository.impl.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfileRepositoryImpl } from './profile-repository.impl';
import { environment } from '../../../environments/environment';

describe('ProfileRepositoryImpl', () => {
  let repository: ProfileRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfileRepositoryImpl, provideHttpClient(), provideHttpClientTesting()]
    });
    repository = TestBed.inject(ProfileRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('createProfile llama a POST /profiles con firstName/lastName/email', () => {
    repository.createProfile({ firstName: 'Nico', lastName: 'Ramos', email: 'nico@weride.com' })
      .subscribe(profile => {
        expect(profile.id).toBe(3);
        expect(profile.fullName).toBe('Nico Ramos');
      });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.profiles}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.firstName).toBe('Nico');
    expect(req.request.body.lastName).toBe('Ramos');
    expect(req.request.body.email).toBe('nico@weride.com');
    req.flush({ id: 3, userId: 7, firstName: 'Nico', lastName: 'Ramos', email: 'nico@weride.com' });
  });

  it('getProfile llama a GET /profiles/{id}', () => {
    repository.getProfile(3).subscribe(profile => {
      expect(profile.email).toBe('nico@weride.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.profiles}/3`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 3, userId: 7, firstName: 'Nico', lastName: 'Ramos', email: 'nico@weride.com' });
  });

  it('traduce un 404 a "Perfil no encontrado"', () => {
    let receivedError: Error | undefined;
    repository.getProfile(999).subscribe({ error: err => (receivedError = err) });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.profiles}/999`);
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    expect(receivedError?.message).toBe('Perfil no encontrado');
  });

  it('traduce un 401 a mensaje de sesión inválida', () => {
    let receivedError: Error | undefined;
    repository.createProfile({ firstName: 'Nico', lastName: 'Ramos', email: 'nico@weride.com' })
      .subscribe({ error: err => (receivedError = err) });

    const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.profiles}`);
    req.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(receivedError?.message).toBe('Sesión inválida, iniciá sesión de nuevo');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/profile-repository.impl.spec.ts' --watch=false`
Expected: FAIL — `Cannot find module './profile-repository.impl'` y `environment.endpoints.profiles` no existe.

- [ ] **Step 3: Agregar el endpoint a los environments**

```typescript
// src/environments/environment.ts — agregar dentro de "endpoints", junto a "authentication"
    authentication: '/authentication',
    profiles: '/profiles',
```

```typescript
// src/environments/environment.prod.ts — agregar dentro de "endpoints", junto a "authentication"
    authentication: '/authentication',
    profiles: '/profiles',
```

- [ ] **Step 4: Implementar `profile-repository.impl.ts`**

```typescript
// src/app/profile/infrastructure/profile-repository.impl.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProfileRepository, CreateProfileData } from '../domain/profile.repository';
import { Profile } from '../domain/model/profile.entity';

interface ProfileResponse {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileRepositoryImpl extends ProfileRepository {
  private readonly baseUrl = `${environment.apiUrl}${environment.endpoints.profiles}`;

  constructor(private http: HttpClient) {
    super();
  }

  createProfile(data: CreateProfileData): Observable<Profile> {
    return this.http.post<ProfileResponse>(this.baseUrl, {
      // ponytail: userId es ignorado por el backend (lo saca del JWT vía
      // CreateProfileCommandFromResourceAssembler) pero el DTO lo exige
      // @NotNull — cualquier valor no-nulo sirve.
      userId: 0,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email
    }).pipe(
      map(response => this.toDomain(response)),
      catchError((err: HttpErrorResponse) => throwError(() => new Error(this.mapError(err))))
    );
  }

  getProfile(profileId: number): Observable<Profile> {
    return this.http.get<ProfileResponse>(`${this.baseUrl}/${profileId}`).pipe(
      map(response => this.toDomain(response)),
      catchError((err: HttpErrorResponse) => throwError(() => new Error(this.mapError(err))))
    );
  }

  private toDomain(response: ProfileResponse): Profile {
    return new Profile(response.id, response.userId, response.firstName, response.lastName, response.email);
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 401) return 'Sesión inválida, iniciá sesión de nuevo';
    if (err.status === 404) return 'Perfil no encontrado';
    if (err.status === 409) return typeof err.error === 'string' && err.error ? err.error : 'El perfil ya existe';
    if (typeof err.error === 'string' && err.error) return err.error;
    return 'Error de conexión con el servidor';
  }
}
```

- [ ] **Step 5: Crear el provider y registrarlo en `app.config.ts`**

```typescript
// src/app/profile/profile.providers.ts
import { Provider } from '@angular/core';
import { ProfileRepository } from './domain/profile.repository';
import { ProfileRepositoryImpl } from './infrastructure/profile-repository.impl';

export const PROFILE_PROVIDERS: Provider[] = [
  {
    provide: ProfileRepository,
    useClass: ProfileRepositoryImpl
  }
];
```

En `src/app/app.config.ts`: agregar el import `import { PROFILE_PROVIDERS } from './profile/profile.providers';` junto al import existente de `AUTH_PROVIDERS`, y agregar `...PROFILE_PROVIDERS` al arreglo `providers`, junto a `...AUTH_PROVIDERS`.

- [ ] **Step 6: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/profile-repository.impl.spec.ts' --watch=false`
Expected: PASS (4 specs)

- [ ] **Step 7: Commit**

```bash
git add src/environments/environment.ts src/environments/environment.prod.ts src/app/profile/infrastructure/profile-repository.impl.ts src/app/profile/infrastructure/profile-repository.impl.spec.ts src/app/profile/profile.providers.ts src/app/app.config.ts
git commit -m "feat(profile): add real ProfileRepositoryImpl against POST/GET /profiles"
```

---

### Task 3: Extender `token-storage.ts` con `profileId`

**Files:**
- Modify: `src/app/auth/infrastructure/token-storage.ts`
- Modify: `src/app/auth/infrastructure/token-storage.spec.ts`

**Interfaces:**
- Produces: `getStoredProfileId(): number | null`, `setStoredProfileId(profileId: number): void` — usados por [[Task 4]] (`ProfileStore.createProfile`) y [[Task 7]] (fetch lazy del perfil al abrir la pantalla).

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `token-storage.spec.ts` (dentro del mismo `describe('token-storage', ...)`, reutilizando el `afterEach` existente):

```typescript
  it('getStoredProfileId devuelve null si no hay sesión guardada', () => {
    expect(getStoredProfileId()).toBeNull();
  });

  it('getStoredProfileId devuelve el profileId guardado', () => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token: 'abc', profileId: 42 }));
    expect(getStoredProfileId()).toBe(42);
  });

  it('setStoredProfileId agrega el profileId a la sesión existente sin perder el token', () => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token: 'abc123' }));
    setStoredProfileId(7);
    const stored = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)!);
    expect(stored.token).toBe('abc123');
    expect(stored.profileId).toBe(7);
  });

  it('setStoredProfileId no hace nada si no hay sesión guardada', () => {
    setStoredProfileId(7);
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
  });
```

Actualizar el import al inicio del archivo:

```typescript
import { AUTH_SESSION_KEY, getStoredToken, decodeJwtExpiry, getStoredProfileId, setStoredProfileId } from './token-storage';
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/token-storage.spec.ts' --watch=false`
Expected: FAIL — `getStoredProfileId`/`setStoredProfileId` no existen todavía.

- [ ] **Step 3: Implementar en `token-storage.ts`**

Modificar la interfaz `StoredAuthSession` y agregar las dos funciones nuevas al final del archivo:

```typescript
interface StoredAuthSession {
  token: string;
  profileId?: number | null;
}

export function getStoredProfileId(): number | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    const data: StoredAuthSession = JSON.parse(raw);
    return data.profileId ?? null;
  } catch {
    return null;
  }
}

export function setStoredProfileId(profileId: number): void {
  if (typeof window === 'undefined') return;

  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    data.profileId = profileId;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data));
  } catch {
    // ponytail: sesión corrupta — no hay nada válido donde adjuntar el profileId.
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/token-storage.spec.ts' --watch=false`
Expected: PASS (9 specs en total: 5 existentes + 4 nuevos)

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/infrastructure/token-storage.ts src/app/auth/infrastructure/token-storage.spec.ts
git commit -m "feat(auth): store profileId alongside the auth session"
```

---

### Task 4: Use-cases y `ProfileStore`

**Files:**
- Create: `src/app/profile/application/create-profile.use-case.ts`
- Create: `src/app/profile/application/get-profile.use-case.ts`
- Create: `src/app/profile/application/profile.store.ts`

**Interfaces:**
- Consumes: `ProfileRepository`, `CreateProfileData`, `Profile` de [[Task 1]]/[[Task 2]]; `setStoredProfileId` de [[Task 3]].
- Produces: `ProfileStore` — signalStore con estado `{ profile: Profile | null, isLoading: boolean, error: string | null }` y métodos `createProfile(data: CreateProfileData)`, `getProfile(profileId: number)` (ambos `rxMethod`, se llaman como funciones: `profileStore.createProfile(data)`) — consumido por [[Task 5]] y [[Task 7]].

Este task no lleva specs propios: sigue el mismo precedente que `auth.store.ts` en la Fase 1 (que tampoco tiene spec dedicado) — su comportamiento se verifica de forma transitiva en [[Task 5]] (creación tras registro) y [[Task 7]] (lectura combinada). Los use-cases son wrappers de una línea sobre el repositorio, sin lógica propia que testear.

- [ ] **Step 1: Crear `create-profile.use-case.ts`**

```typescript
// src/app/profile/application/create-profile.use-case.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileRepository, CreateProfileData } from '../domain/profile.repository';
import { Profile } from '../domain/model/profile.entity';

@Injectable({ providedIn: 'root' })
export class CreateProfileUseCase {
  constructor(private profileRepository: ProfileRepository) {}

  execute(data: CreateProfileData): Observable<Profile> {
    return this.profileRepository.createProfile(data);
  }
}
```

- [ ] **Step 2: Crear `get-profile.use-case.ts`**

```typescript
// src/app/profile/application/get-profile.use-case.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileRepository } from '../domain/profile.repository';
import { Profile } from '../domain/model/profile.entity';

@Injectable({ providedIn: 'root' })
export class GetProfileUseCase {
  constructor(private profileRepository: ProfileRepository) {}

  execute(profileId: number): Observable<Profile> {
    return this.profileRepository.getProfile(profileId);
  }
}
```

- [ ] **Step 3: Crear `profile.store.ts`**

```typescript
// src/app/profile/application/profile.store.ts
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { Profile } from '../domain/model/profile.entity';
import { CreateProfileData } from '../domain/profile.repository';
import { CreateProfileUseCase } from './create-profile.use-case';
import { GetProfileUseCase } from './get-profile.use-case';
import { setStoredProfileId } from '../../auth/infrastructure/token-storage';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null
};

export const ProfileStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const createProfileUseCase = inject(CreateProfileUseCase);
    const getProfileUseCase = inject(GetProfileUseCase);

    return {
      createProfile: rxMethod<CreateProfileData>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            createProfileUseCase.execute(data).pipe(
              tap((profile) => {
                setStoredProfileId(profile.id);
                patchState(store, { profile, isLoading: false, error: null });
              }),
              catchError((error) => {
                patchState(store, { isLoading: false, error: error.message || 'Error al crear el perfil' });
                return of(null);
              })
            )
          )
        )
      ),

      getProfile: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((profileId) =>
            getProfileUseCase.execute(profileId).pipe(
              tap((profile) => {
                patchState(store, { profile, isLoading: false, error: null });
              }),
              catchError((error) => {
                patchState(store, { isLoading: false, error: error.message || 'Error al cargar el perfil' });
                return of(null);
              })
            )
          )
        )
      )
    };
  })
);
```

- [ ] **Step 4: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/application/create-profile.use-case.ts src/app/profile/application/get-profile.use-case.ts src/app/profile/application/profile.store.ts
git commit -m "feat(profile): add use-cases and ProfileStore"
```

---

### Task 5: Crear el perfil real justo después del registro

**Files:**
- Modify: `src/app/auth/presentation/views/email-login/email-login.component.ts`
- Modify: `src/app/auth/presentation/views/email-login/email-login.component.spec.ts`

**Interfaces:**
- Consumes: `ProfileStore.createProfile(data: CreateProfileData)` de [[Task 4]].

- [ ] **Step 1: Escribir el test que falla**

Agregar el import y el spy de `ProfileStore` al inicio del `describe`, y un test nuevo. El archivo completo queda así:

```typescript
// src/app/auth/presentation/views/email-login/email-login.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EmailLoginComponent } from './email-login.component';
import { AuthStore } from '../../../application/auth.store';
import { ProfileStore } from '../../../../profile/application/profile.store';
import { AuthCredentials } from '../../../domain/model/auth-credentials.entity';
import { RegistrationData } from '../../../domain/model/registration-data.entity';
import { User } from '../../../domain/model/user.entity';

describe('EmailLoginComponent', () => {
  let component: EmailLoginComponent;
  let fixture: ComponentFixture<EmailLoginComponent>;
  let authStoreSpy: jasmine.SpyObj<Pick<InstanceType<typeof AuthStore>, 'loginWithEmail' | 'registerUser'>> & {
    session: ReturnType<typeof signal<any>>;
    currentUser: ReturnType<typeof signal<any>>;
    error: ReturnType<typeof signal<any>>;
    isLoading: ReturnType<typeof signal<boolean>>;
  };
  let profileStoreSpy: jasmine.SpyObj<Pick<InstanceType<typeof ProfileStore>, 'createProfile'>>;

  beforeEach(async () => {
    authStoreSpy = jasmine.createSpyObj('AuthStore', ['loginWithEmail', 'registerUser']) as any;
    authStoreSpy.session = signal<any>(null);
    authStoreSpy.currentUser = signal<any>(null);
    authStoreSpy.error = signal<any>(null);
    authStoreSpy.isLoading = signal(false);

    profileStoreSpy = jasmine.createSpyObj('ProfileStore', ['createProfile']);

    await TestBed.configureTestingModule({
      imports: [EmailLoginComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: AuthStore, useValue: authStoreSpy },
        { provide: ProfileStore, useValue: profileStoreSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmailLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('en modo login, llama a authStore.loginWithEmail con las credenciales del formulario', () => {
    component.email.set('nico@weride.com');
    component.password.set('secret123');

    component.continue();

    expect(authStoreSpy.loginWithEmail).toHaveBeenCalledWith(
      new AuthCredentials('nico@weride.com', 'secret123')
    );
  });

  it('en modo registro, llama a authStore.registerUser con el password del formulario', () => {
    component.isRegisterMode.set(true);
    component.email.set('nico@weride.com');
    component.password.set('secret123');
    component.firstName.set('Nico');
    component.lastName.set('Ramos');

    component.continue();

    expect(authStoreSpy.registerUser).toHaveBeenCalledWith(
      new RegistrationData('Nico', 'Ramos', '', 'nico@weride.com', 'secret123')
    );
  });

  it('tras un registro exitoso dispara un unico auto-login y el guard justRegistered evita repetirlo', () => {
    component.isRegisterMode.set(true);
    component.email.set('nico@weride.com');
    component.password.set('secret123');
    component.firstName.set('Nico');
    component.lastName.set('Ramos');

    component.continue();
    expect(authStoreSpy.registerUser).toHaveBeenCalledTimes(1);

    authStoreSpy.currentUser.set(new User(
      '1', 'Nico Ramos', 'nico@weride.com', '', 'basic', true, '', '', '', '', 'verified', '', {
        language: 'es', notifications: true, theme: 'light'
      }, { totalTrips: 0, totalDistance: 0, totalSpent: 0, averageRating: 0 }
    ));
    fixture.detectChanges();

    expect(authStoreSpy.loginWithEmail).toHaveBeenCalledTimes(1);

    authStoreSpy.isLoading.set(true);
    fixture.detectChanges();
    authStoreSpy.isLoading.set(false);
    fixture.detectChanges();

    expect(authStoreSpy.loginWithEmail).toHaveBeenCalledTimes(1);
  });

  it('tras un registro exitoso con sesion valida, crea el profile real una sola vez', () => {
    component.isRegisterMode.set(true);
    component.email.set('nico@weride.com');
    component.password.set('secret123');
    component.firstName.set('Nico');
    component.lastName.set('Ramos');

    component.continue();

    const exp = new Date();
    exp.setHours(exp.getHours() + 1);
    authStoreSpy.session.set({ isValid: true, expiresAt: exp });
    fixture.detectChanges();

    expect(profileStoreSpy.createProfile).toHaveBeenCalledTimes(1);
    expect(profileStoreSpy.createProfile).toHaveBeenCalledWith({
      firstName: 'Nico',
      lastName: 'Ramos',
      email: 'nico@weride.com'
    });

    authStoreSpy.isLoading.set(true);
    fixture.detectChanges();
    authStoreSpy.isLoading.set(false);
    fixture.detectChanges();

    expect(profileStoreSpy.createProfile).toHaveBeenCalledTimes(1);
  });

  it('en un login normal (sin registro previo) NO crea un profile', () => {
    component.email.set('nico@weride.com');
    component.password.set('secret123');

    component.continue();

    const exp = new Date();
    exp.setHours(exp.getHours() + 1);
    authStoreSpy.session.set({ isValid: true, expiresAt: exp });
    fixture.detectChanges();

    expect(profileStoreSpy.createProfile).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/email-login.component.spec.ts' --watch=false`
Expected: FAIL — `ProfileStore` no existe en `email-login.component.ts` todavía; el test de "crea el profile" no encuentra la llamada.

- [ ] **Step 3: Implementar en `email-login.component.ts`**

Agregar el import y la inyección de `ProfileStore`, y disparar `createProfile` dentro del `effect()` cuando la sesión queda válida tras un registro (`justRegistered()` en `true`), antes de resetear el flag:

```typescript
import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { ProfileStore } from '../../../../profile/application/profile.store';
import { AuthCredentials } from '../../../domain/model/auth-credentials.entity';
import { RegistrationData } from '../../../domain/model/registration-data.entity';

@Component({
  selector: 'app-email-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './email-login.component.html',
  styleUrl: './email-login.component.css'
})
export class EmailLoginComponent {
  private router = inject(Router);
  protected authStore = inject(AuthStore);
  private profileStore = inject(ProfileStore);

  email = signal('');
  password = signal('');
  firstName = signal('');
  lastName = signal('');
  showPassword = signal(false);
  isRegisterMode = signal(false);
  private actionAttempted = signal(false);
  private justRegistered = signal(false);

  constructor() {
    effect(() => {
      const session = this.authStore.session();
      const currentUser = this.authStore.currentUser();
      const error = this.authStore.error();
      const isLoading = this.authStore.isLoading();

      if (!this.actionAttempted() || isLoading) return;

      if (session && session.isValid && !error) {
        if (this.justRegistered()) {
          this.profileStore.createProfile({
            firstName: this.firstName(),
            lastName: this.lastName(),
            email: this.email()
          });
        }
        this.router.navigate(['/home']);
        this.actionAttempted.set(false);
        this.justRegistered.set(false);
        return;
      }

      // El registro exitoso solo crea la cuenta (no devuelve token) —
      // hace falta un sign-in real aparte para obtener la sesión.
      if (this.isRegisterMode() && currentUser && !error && !session && !this.justRegistered()) {
        this.justRegistered.set(true);
        this.authStore.loginWithEmail(new AuthCredentials(this.email(), this.password()));
      }
    });
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  toggleMode() {
    this.isRegisterMode.set(!this.isRegisterMode());
    this.email.set('');
    this.password.set('');
    this.firstName.set('');
    this.lastName.set('');
    this.authStore.clearError();
  }

  continue() {
    if (this.isRegisterMode()) {
      if (this.email() && this.password() && this.firstName() && this.lastName()) {
        const registrationData = new RegistrationData(
          this.firstName(),
          this.lastName(),
          '',
          this.email(),
          this.password()
        );
        this.actionAttempted.set(true);
        this.authStore.registerUser(registrationData);
      }
    } else {
      if (this.email() && this.password()) {
        this.actionAttempted.set(true);
        this.authStore.loginWithEmail(new AuthCredentials(this.email(), this.password()));
      }
    }
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/email-login.component.spec.ts' --watch=false`
Expected: PASS (5 specs)

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/presentation/views/email-login/email-login.component.ts src/app/auth/presentation/views/email-login/email-login.component.spec.ts
git commit -m "feat(profile): create real profile automatically right after registration"
```

---

### Task 6: `CurrentUserViewService` (identidad combinada auth + profile)

**Files:**
- Create: `src/app/profile/application/current-user-view.service.ts`
- Test: `src/app/profile/application/current-user-view.service.spec.ts`

**Interfaces:**
- Consumes: `AuthStore.currentUser` (signal, tipo `User` de `src/app/auth/domain/model/user.entity.ts`) de la Fase 1; `ProfileStore.profile` (signal, tipo `Profile`) de [[Task 4]].
- Produces: función pura `toCurrentUserView(authUser, profile): User | null` (tipo `User` de `src/app/user/domain/model/user.entity.ts`, el que ya consumen las 6 tarjetas de perfil) y `CurrentUserViewService.getCurrentUser$(): Observable<User | null>` — consumidos por [[Task 7]].

- [ ] **Step 1: Escribir los tests que fallan**

```typescript
// src/app/profile/application/current-user-view.service.spec.ts
import { toCurrentUserView } from './current-user-view.service';
import { User as AuthUser } from '../../auth/domain/model/user.entity';
import { Profile } from '../domain/model/profile.entity';

describe('toCurrentUserView', () => {
  const authUser = new AuthUser(
    '7', 'nico', 'nico@weride.com', '', '', true, '', '', '', '', 'pending',
    '2026-07-25T00:00:00.000Z',
    { language: 'es', notifications: true, theme: 'light' },
    { totalTrips: 0, totalDistance: 0, totalSpent: 0, averageRating: 0 }
  );

  it('devuelve null si no hay usuario autenticado', () => {
    expect(toCurrentUserView(null, null)).toBeNull();
  });

  it('usa el nombre/email del auth user si el profile aun no cargo', () => {
    const result = toCurrentUserView(authUser, null);
    expect(result?.name).toBe('nico');
    expect(result?.email).toBe('nico@weride.com');
    expect(result?.id).toBe(7);
  });

  it('usa firstName+lastName y email del profile real cuando esta disponible', () => {
    const profile = new Profile(3, 7, 'Nico', 'Ramos', 'nico.real@weride.com');
    const result = toCurrentUserView(authUser, profile);
    expect(result?.name).toBe('Nico Ramos');
    expect(result?.email).toBe('nico.real@weride.com');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/current-user-view.service.spec.ts' --watch=false`
Expected: FAIL — `Cannot find module './current-user-view.service'`

- [ ] **Step 3: Implementar `current-user-view.service.ts`**

```typescript
// src/app/profile/application/current-user-view.service.ts
import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthStore } from '../../auth/application/auth.store';
import { User as AuthUser } from '../../auth/domain/model/user.entity';
import { ProfileStore } from './profile.store';
import { Profile } from '../domain/model/profile.entity';
import { User } from '../../user/domain/model/user.entity';

export function toCurrentUserView(authUser: AuthUser | null, profile: Profile | null): User | null {
  if (!authUser) return null;

  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : authUser.name;
  const email = profile?.email ?? authUser.email;

  return new User(
    Number(authUser.id) || 0,
    name,
    email,
    0,
    authUser.phone,
    authUser.membershipPlanId,
    authUser.isActive,
    authUser.profilePicture,
    authUser.dateOfBirth,
    authUser.address,
    authUser.emergencyContact,
    authUser.verificationStatus,
    new Date(authUser.registrationDate),
    authUser.preferences,
    authUser.statistics
  );
}

@Injectable({ providedIn: 'root' })
export class CurrentUserViewService {
  private readonly authStore = inject(AuthStore);
  private readonly profileStore = inject(ProfileStore);

  getCurrentUser$(): Observable<User | null> {
    return combineLatest([
      toObservable(this.authStore.currentUser),
      toObservable(this.profileStore.profile)
    ]).pipe(
      map(([authUser, profile]) => toCurrentUserView(authUser, profile))
    );
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/current-user-view.service.spec.ts' --watch=false`
Expected: PASS (3 specs)

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/application/current-user-view.service.ts src/app/profile/application/current-user-view.service.spec.ts
git commit -m "feat(profile): add CurrentUserViewService merging auth session with real profile"
```

---

### Task 7: Rewiring de las tarjetas de perfil a la identidad real

**Files:**
- Modify: `src/app/user/presentation/views/user-stats/user-stats.ts`
- Modify: `src/app/user/presentation/views/user-wallet-card/user-wallet-card.ts`
- Modify: `src/app/user/presentation/views/user-security-card/user-security-card.ts`
- Modify: `src/app/user/presentation/views/user-settings-card/user-settings-card.ts`
- Modify: `src/app/user/presentation/views/user-history-card/user-history-card.ts`
- Modify: `src/app/user/presentation/views/user-personal-info-card/user-personal-info-card.ts`
- Modify: `src/app/user/presentation/views/user-layout/user-layout.ts`

**Interfaces:**
- Consumes: `CurrentUserViewService.getCurrentUser$()` de [[Task 6]]; `ProfileStore.getProfile(profileId)` de [[Task 4]]; `getStoredProfileId()` de [[Task 3]].

Este task es mecánico (un cambio de una línea de origen de datos por archivo) y ya cuenta con specs de humo existentes (`should create`) que se apoyan en los servicios reales `providedIn: 'root'` — no necesitan reescribirse porque no mockean `UserStore`. No se agregan specs nuevas en este task: la lógica no trivial (el merge auth+profile) ya se verificó en [[Task 6]].

- [ ] **Step 1: `user-stats.ts` — leer la identidad real**

```typescript
// src/app/user/presentation/views/user-stats/user-stats.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
import { User } from '../../../domain/model/user.entity';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './user-stats.html',
  styleUrl: './user-stats.css'
})
export class UserStats implements OnInit {
  private readonly currentUserView = inject(CurrentUserViewService);
  user$: Observable<User | null> = this.currentUserView.getCurrentUser$();

  ngOnInit(): void {}

  getInitials(name?: string | null): string {
    if (!name) {
      return 'G';
    }
    return name
      .split(' ')
      .filter(part => part)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('') || 'G';
  }
}
```

- [ ] **Step 2: `user-wallet-card.ts` — leer la identidad real**

Reemplazar las líneas de import/inyección de `UserStore` y la asignación de `user$`:

```typescript
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
```
```typescript
  private readonly currentUserView = inject(CurrentUserViewService);
  private readonly paymentsService = inject(UserPaymentsService);
  private readonly stateService = inject(UserSettingsStateService);

  user$ = this.currentUserView.getCurrentUser$();
```

(el resto del archivo — `payments$`, `totalSpent$`, `closeCard`, `formatCurrency`, `formatDate` — queda igual; siguen usando `user.id` para los mocks de wallet, sin cambios de comportamiento en esos datos.)

- [ ] **Step 3: `user-security-card.ts` — leer la identidad real**

```typescript
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
```
```typescript
  private readonly currentUserView = inject(CurrentUserViewService);
  private readonly stateService = inject(UserSettingsStateService);

  user$ = this.currentUserView.getCurrentUser$();
```

- [ ] **Step 4: `user-settings-card.ts` — leer la identidad real**

```typescript
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
```
```typescript
  private readonly currentUserView = inject(CurrentUserViewService);
  private readonly stateService = inject(UserSettingsStateService);

  user$ = this.currentUserView.getCurrentUser$();
```

- [ ] **Step 5: `user-history-card.ts` — leer la identidad real**

```typescript
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
```
```typescript
  private readonly currentUserView = inject(CurrentUserViewService);
  private readonly tripsApi = inject(TripsApiEndpoint);
  private readonly bookingsApi = inject(BookingsApiEndpoint);
  private readonly stateService = inject(UserSettingsStateService);

  user$ = this.currentUserView.getCurrentUser$();
```

- [ ] **Step 6: `user-personal-info-card.ts` — leer la identidad real, mantener guardado mock**

Reemplazar solo el origen de `user$` (se mantiene `UserStore` inyectado porque `savePersonalInfo()` lo sigue usando para el guardado mock):

```typescript
import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
```
```typescript
  private readonly userStore = inject(UserStore);
  private readonly currentUserView = inject(CurrentUserViewService);
  private readonly stateService = inject(UserSettingsStateService);
  private readonly fb = inject(FormBuilder);

  user$ = this.currentUserView.getCurrentUser$();
```

Y agregar el comentario TODO justo antes de `savePersonalInfo(): void {`:

```typescript
  // TODO backend: falta PUT /profiles/{id} — este guardado sigue siendo
  // mock/local hasta que el backend soporte editar el perfil real.
  savePersonalInfo(): void {
```

- [ ] **Step 7: `user-layout.ts` — quitar el mock, disparar el fetch lazy del perfil**

```typescript
// src/app/user/presentation/views/user-layout/user-layout.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { UserStats } from '../user-stats/user-stats';
import { UserSettings } from '../user-settings/user-settings';
import { UserWalletCard } from '../user-wallet-card/user-wallet-card';
import { UserHistoryCard } from '../user-history-card/user-history-card';
import { UserSecurityCard } from '../user-security-card/user-security-card';
import { UserHelpCard } from '../user-help-card/user-help-card';
import { UserSettingsCard } from '../user-settings-card/user-settings-card';
import { UserPersonalInfoCard } from '../user-personal-info-card/user-personal-info-card';
import { UserSettingsStateService, UserSettingsSection } from '../../../application/user-settings-state.service';
import { ProfileStore } from '../../../../profile/application/profile.store';
import { getStoredProfileId } from '../../../../auth/infrastructure/token-storage';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [
    CommonModule,
    UserStats,
    UserSettings,
    UserWalletCard,
    UserHistoryCard,
    UserSecurityCard,
    UserHelpCard,
    UserSettingsCard,
    UserPersonalInfoCard
  ],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.css'
})
export class UserLayout implements OnInit {
  private readonly stateService = inject(UserSettingsStateService);
  private readonly profileStore = inject(ProfileStore);

  activeSection: UserSettingsSection = null;

  ngOnInit(): void {
    const profileId = getStoredProfileId();
    if (profileId && !this.profileStore.profile()) {
      this.profileStore.getProfile(profileId);
    }
    this.stateService.activeSection$.subscribe(section => {
      this.activeSection = section;
    });
  }
}
```

- [ ] **Step 8: Correr toda la suite y verificar que no hay regresiones**

Run: `npx ng test --watch=false`
Expected: mismo conteo de fallos preexistentes que la Fase 1 dejó documentado en su ledger (31 FAILED no relacionados); ningún test nuevo debe fallar. Si aparece algún fallo en los 6 archivos tocados, es una regresión de este task — corregir antes de continuar.

- [ ] **Step 9: Commit**

```bash
git add src/app/user/presentation/views/user-stats/user-stats.ts src/app/user/presentation/views/user-wallet-card/user-wallet-card.ts src/app/user/presentation/views/user-security-card/user-security-card.ts src/app/user/presentation/views/user-settings-card/user-settings-card.ts src/app/user/presentation/views/user-history-card/user-history-card.ts src/app/user/presentation/views/user-personal-info-card/user-personal-info-card.ts src/app/user/presentation/views/user-layout/user-layout.ts
git commit -m "feat(profile): show the real logged-in user on the profile screen instead of a mock guest"
```
