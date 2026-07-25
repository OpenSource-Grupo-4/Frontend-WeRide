# WeRide Vehicles/Locations/Plans (Fase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar la capa de datos de Vehicles con create/update/delete reales contra el backend (que ya los soporta sin restricción de dueño), y documentar explícitamente — sin tocar funcionalmente — las brechas de Locations y Plans, cuyo backend real no soporta todas las operaciones que el frontend asume.

**Architecture:** Extensión del módulo `garage/` existente siguiendo su propio patrón (repositorio abstracto + `Promise`-based use-cases + mapper), sin introducir el patrón `signalStore` de `auth`/`profile` (no corresponde forzar la convención de otro módulo). Locations y Plans no reciben cambios funcionales — solo un fix de configuración de una línea y comentarios de documentación.

**Tech Stack:** Angular 20 standalone components/services, RxJS + `firstValueFrom` (Promise interop, patrón ya usado en `garage/infrastructure/http/vehicle-api.service.ts`), `HttpClient`, Karma + Jasmine (`ng test`), `HttpClientTestingModule`/`HttpTestingController`.

## Global Constraints

- Esta rama parte de `worktree-weride-auth-phase1` (commit `2f1405c`, Fases 1+2 ya implementadas). El worktree de esta fase debe crearse sobre esa rama/commit.
- Backend real de Vehicle (`/api/v1/vehicles`): CRUD completo (`POST`, `GET`, `GET/{id}`, `PUT/{id}`, `DELETE/{id}`), JWT requerido, **sin dueño** — no hay FK a Account/Profile, cualquier usuario autenticado puede operar sobre cualquier vehículo.
- Shape del body de creación/edición de Vehicle (igual que `VehicleApiResponse`/`Vehicle` ya existentes en este módulo, sin el campo derivado `favorite`): `brand, model, year, battery, maxSpeed, range, weight, color, licensePlate, location, status, type, companyId, pricePerMinute, image, features, maintenanceStatus, lastMaintenance, nextMaintenance, totalKilometers, rating`.
- Errores del backend son texto plano (mismo patrón de Fase 1/2): 401 credenciales/token inválido, 404 no encontrado, 409 conflicto, resto = error de conexión.
- **No se construyen pantallas nuevas de Vehicles en esta fase** — solo la capa repo/use-cases/api. No existe hoy ninguna UI de alta/edición en `garage/presentation/views`.
- Backend real de Location (`/api/v1/location`): **solo `POST` (crea, responde 201 con body vacío) y `GET` (lista)** — NO existen `GET/{id}`, `PUT` ni `DELETE`. No se modifica funcionalmente `locations-api-endpoint.ts` — solo se documenta con comentarios `PENDIENTE backend`.
- Backend real de Plan (`/api/v1/plans`): NO existe `PUT /plans/{id}`. No se modifica funcionalmente `plans-api-endpoint.ts` — solo se documenta con un comentario `PENDIENTE backend`.
- `environment.prod.ts` tiene `locations: '/locations'` (plural), inconsistente con `environment.ts` (dev, `/location` singular) y con el path real del backend (`/location` singular) — se corrige a `/location`.
- Fuera de alcance: Trips, Bookings, Travel History, Notifications (fases futuras); stubs `booking/presentation/views/vehicle-form` y `location-form` (código muerto no relacionado).

---

### Task 1: `VehicleApiService` — métodos HTTP de create/update/delete

**Files:**
- Modify: `src/app/garage/infrastructure/http/vehicle-api.service.ts`
- Test: `src/app/garage/infrastructure/http/vehicle-api.service.spec.ts` (nuevo)

**Interfaces:**
- Produces: `VehicleApiService.createVehicle(body: CreateVehicleRequest): Promise<VehicleApiResponse>`, `updateVehicle(id: string, body: CreateVehicleRequest): Promise<VehicleApiResponse>`, `deleteVehicle(id: string): Promise<void>` — consumidos por [[Task 3]]. `CreateVehicleRequest` (nueva interfaz exportada desde este archivo) — consumida por [[Task 2]].

- [ ] **Step 1: Escribir los tests que fallan**

```typescript
// src/app/garage/infrastructure/http/vehicle-api.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleApiService, VehicleApiResponse, CreateVehicleRequest } from './vehicle-api.service';
import { environment } from '../../../../environments/environment';

describe('VehicleApiService - CRUD real', () => {
  let service: VehicleApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.endpoints.vehicles}`;

  const requestBody: CreateVehicleRequest = {
    brand: 'Xiaomi', model: 'Pro 2', year: 2024, battery: 100, maxSpeed: 25,
    range: 40, weight: 14, color: 'negro', licensePlate: 'ABC-123',
    location: 'Miraflores', status: 'available', type: 'electric_scooter',
    companyId: 'weride', pricePerMinute: 0.5, image: 'scooter.png',
    features: ['gps'], maintenanceStatus: 'ok', lastMaintenance: '2026-01-01',
    nextMaintenance: '2026-06-01', totalKilometers: 0, rating: 5
  };

  const apiResponse: VehicleApiResponse = { id: '10', ...requestBody };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VehicleApiService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(VehicleApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('createVehicle llama a POST /vehicles con el body completo', async () => {
    const promise = service.createVehicle(requestBody);
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(requestBody);
    req.flush(apiResponse);
    expect(await promise).toEqual(apiResponse);
  });

  it('updateVehicle llama a PUT /vehicles/{id} con el body completo', async () => {
    const promise = service.updateVehicle('10', requestBody);
    const req = httpMock.expectOne(`${baseUrl}/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(requestBody);
    req.flush(apiResponse);
    expect(await promise).toEqual(apiResponse);
  });

  it('deleteVehicle llama a DELETE /vehicles/{id}', async () => {
    const promise = service.deleteVehicle('10');
    const req = httpMock.expectOne(`${baseUrl}/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await promise;
    expect().nothing();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/vehicle-api.service.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `createVehicle`/`updateVehicle`/`deleteVehicle`/`CreateVehicleRequest` no existen todavía en `vehicle-api.service.ts`.

- [ ] **Step 3: Implementar en `vehicle-api.service.ts`**

Agregar la interfaz `CreateVehicleRequest` y los 3 métodos nuevos al final de la clase existente:

```typescript
export interface CreateVehicleRequest {
  brand: string;
  model: string;
  year: number;
  battery: number;
  maxSpeed: number;
  range: number;
  weight: number;
  color: string;
  licensePlate: string;
  location: string;
  status: string;
  type: string;
  companyId: string;
  pricePerMinute: number;
  image: string;
  features: string[];
  maintenanceStatus: string;
  lastMaintenance: string;
  nextMaintenance: string;
  totalKilometers: number;
  rating: number;
}
```

Y dentro de la clase `VehicleApiService`, después de `getVehicleByIdAsync`:

```typescript
  async createVehicle(body: CreateVehicleRequest): Promise<VehicleApiResponse> {
    return firstValueFrom(this.http.post<VehicleApiResponse>(this.apiUrl, body));
  }

  async updateVehicle(id: string, body: CreateVehicleRequest): Promise<VehicleApiResponse> {
    return firstValueFrom(this.http.put<VehicleApiResponse>(`${this.apiUrl}/${id}`, body));
  }

  async deleteVehicle(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/vehicle-api.service.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS (3 specs)

- [ ] **Step 5: Commit**

```bash
git add src/app/garage/infrastructure/http/vehicle-api.service.ts src/app/garage/infrastructure/http/vehicle-api.service.spec.ts
git commit -m "feat(garage): add create/update/delete HTTP methods to VehicleApiService"
```

---

### Task 2: `VehicleMapper` — mapeo dominio → request de creación/edición

**Files:**
- Modify: `src/app/garage/infrastructure/mappers/vehicle.mapper.ts`
- Test: `src/app/garage/infrastructure/mappers/vehicle.mapper.spec.ts` (nuevo)

**Interfaces:**
- Consumes: `CreateVehicleRequest` de [[Task 1]]; `Vehicle` de `src/app/garage/domain/model/vehicle.model.ts` (ya existente).
- Produces: `VehicleMapper.toApiRequest(vehicle: Omit<Vehicle, 'id' | 'favorite'>): CreateVehicleRequest` — consumido por [[Task 3]].

- [ ] **Step 1: Escribir el test que falla**

```typescript
// src/app/garage/infrastructure/mappers/vehicle.mapper.spec.ts
import { VehicleMapper } from './vehicle.mapper';
import { Vehicle } from '../../domain/model/vehicle.model';

describe('VehicleMapper.toApiRequest', () => {
  it('mapea un Vehicle (sin id ni favorite) al shape que espera el backend', () => {
    const vehicle: Omit<Vehicle, 'id' | 'favorite'> = {
      brand: 'Xiaomi', model: 'Pro 2', year: 2024, battery: 100, maxSpeed: 25,
      range: 40, weight: 14, color: 'negro', licensePlate: 'ABC-123',
      location: 'Miraflores', status: 'available', type: 'electric_scooter',
      companyId: 'weride', pricePerMinute: 0.5, image: 'scooter.png',
      features: ['gps'], maintenanceStatus: 'ok', lastMaintenance: '2026-01-01',
      nextMaintenance: '2026-06-01', totalKilometers: 0, rating: 5
    };

    const request = VehicleMapper.toApiRequest(vehicle);

    expect(request).toEqual({
      brand: 'Xiaomi', model: 'Pro 2', year: 2024, battery: 100, maxSpeed: 25,
      range: 40, weight: 14, color: 'negro', licensePlate: 'ABC-123',
      location: 'Miraflores', status: 'available', type: 'electric_scooter',
      companyId: 'weride', pricePerMinute: 0.5, image: 'scooter.png',
      features: ['gps'], maintenanceStatus: 'ok', lastMaintenance: '2026-01-01',
      nextMaintenance: '2026-06-01', totalKilometers: 0, rating: 5
    });
    expect((request as any).id).toBeUndefined();
    expect((request as any).favorite).toBeUndefined();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/vehicle.mapper.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `VehicleMapper.toApiRequest` no existe todavía.

- [ ] **Step 3: Implementar `toApiRequest` en `vehicle.mapper.ts`**

Agregar el import de `CreateVehicleRequest` y el método estático:

```typescript
import { VehicleApiResponse, CreateVehicleRequest } from '../http/vehicle-api.service';
```

```typescript
  static toApiRequest(vehicle: Omit<Vehicle, 'id' | 'favorite'>): CreateVehicleRequest {
    return {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      battery: vehicle.battery,
      maxSpeed: vehicle.maxSpeed,
      range: vehicle.range,
      weight: vehicle.weight,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      location: vehicle.location,
      status: vehicle.status,
      type: vehicle.type,
      companyId: vehicle.companyId,
      pricePerMinute: vehicle.pricePerMinute,
      image: vehicle.image,
      features: vehicle.features ?? [],
      maintenanceStatus: vehicle.maintenanceStatus,
      lastMaintenance: vehicle.lastMaintenance,
      nextMaintenance: vehicle.nextMaintenance,
      totalKilometers: vehicle.totalKilometers,
      rating: vehicle.rating
    };
  }
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/vehicle.mapper.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS (1 spec)

- [ ] **Step 5: Commit**

```bash
git add src/app/garage/infrastructure/mappers/vehicle.mapper.ts src/app/garage/infrastructure/mappers/vehicle.mapper.spec.ts
git commit -m "feat(garage): add VehicleMapper.toApiRequest for create/update payloads"
```

---

### Task 3: `VehicleRepository`/`VehicleRepositoryImpl` — create/update/remove

**Files:**
- Modify: `src/app/garage/application/repositories/vehicle.repository.ts`
- Modify: `src/app/garage/infrastructure/repositories/vehicle.repository.impl.ts`
- Test: `src/app/garage/infrastructure/repositories/vehicle.repository.impl.spec.ts` (nuevo)

**Interfaces:**
- Consumes: `VehicleApiService.createVehicle/updateVehicle/deleteVehicle` de [[Task 1]]; `VehicleMapper.toApiRequest` de [[Task 2]].
- Produces: `VehicleRepository.create(vehicle: Omit<Vehicle,'id'|'favorite'>): Promise<Vehicle>`, `update(id: string, vehicle: Omit<Vehicle,'id'|'favorite'>): Promise<Vehicle>`, `remove(id: string): Promise<void>` — consumidos por [[Task 4]].

- [ ] **Step 1: Escribir los tests que fallan**

```typescript
// src/app/garage/infrastructure/repositories/vehicle.repository.impl.spec.ts
import { TestBed } from '@angular/core/testing';
import { VehicleRepositoryImpl } from './vehicle.repository.impl';
import { VehicleApiService, VehicleApiResponse } from '../http/vehicle-api.service';
import { Vehicle } from '../../domain/model/vehicle.model';

describe('VehicleRepositoryImpl - CRUD real', () => {
  let repository: VehicleRepositoryImpl;
  let apiSpy: jasmine.SpyObj<Pick<VehicleApiService, 'createVehicle' | 'updateVehicle' | 'deleteVehicle'>>;

  const vehicleInput: Omit<Vehicle, 'id' | 'favorite'> = {
    brand: 'Xiaomi', model: 'Pro 2', year: 2024, battery: 100, maxSpeed: 25,
    range: 40, weight: 14, color: 'negro', licensePlate: 'ABC-123',
    location: 'Miraflores', status: 'available', type: 'electric_scooter',
    companyId: 'weride', pricePerMinute: 0.5, image: 'scooter.png',
    features: ['gps'], maintenanceStatus: 'ok', lastMaintenance: '2026-01-01',
    nextMaintenance: '2026-06-01', totalKilometers: 0, rating: 5
  };

  const apiResponse: VehicleApiResponse = { id: '10', ...vehicleInput };

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('VehicleApiService', ['createVehicle', 'updateVehicle', 'deleteVehicle']);

    TestBed.configureTestingModule({
      providers: [VehicleRepositoryImpl, { provide: VehicleApiService, useValue: apiSpy }]
    });
    repository = TestBed.inject(VehicleRepositoryImpl);
  });

  it('create() llama a createVehicle con el body mapeado y devuelve el Vehicle de dominio', async () => {
    apiSpy.createVehicle.and.returnValue(Promise.resolve(apiResponse));

    const result = await repository.create(vehicleInput);

    expect(apiSpy.createVehicle).toHaveBeenCalledWith(jasmine.objectContaining({ brand: 'Xiaomi', model: 'Pro 2' }));
    expect(result.id).toBe('10');
    expect(result.brand).toBe('Xiaomi');
  });

  it('update() llama a updateVehicle con el id y el body mapeado', async () => {
    apiSpy.updateVehicle.and.returnValue(Promise.resolve(apiResponse));

    const result = await repository.update('10', vehicleInput);

    expect(apiSpy.updateVehicle).toHaveBeenCalledWith('10', jasmine.objectContaining({ brand: 'Xiaomi' }));
    expect(result.id).toBe('10');
  });

  it('remove() llama a deleteVehicle con el id', async () => {
    apiSpy.deleteVehicle.and.returnValue(Promise.resolve());

    await repository.remove('10');

    expect(apiSpy.deleteVehicle).toHaveBeenCalledWith('10');
  });

  it('create() propaga un error legible si la llamada falla', async () => {
    apiSpy.createVehicle.and.returnValue(Promise.reject(new Error('network down')));

    await expectAsync(repository.create(vehicleInput)).toBeRejectedWithError('No se pudo crear el vehículo');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --include='**/vehicle.repository.impl.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `create`/`update`/`remove` no existen todavía en `VehicleRepositoryImpl` (ni en la clase abstracta).

- [ ] **Step 3: Extender la clase abstracta `VehicleRepository`**

```typescript
// src/app/garage/application/repositories/vehicle.repository.ts
import { Vehicle } from '../../domain/model/vehicle.model';

export abstract class VehicleRepository {
  abstract findAll(): Promise<Vehicle[]>;
  abstract create(vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle>;
  abstract update(id: string, vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle>;
  abstract remove(id: string): Promise<void>;
}
```

- [ ] **Step 4: Implementar en `VehicleRepositoryImpl`**

```typescript
// src/app/garage/infrastructure/repositories/vehicle.repository.impl.ts
import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleRepository } from '../../application/repositories/vehicle.repository';
import { Injectable } from '@angular/core';
import { VehicleApiService } from '../http/vehicle-api.service';
import { VehicleMapper } from '../mappers/vehicle.mapper';

@Injectable({
  providedIn: 'root'
})
export class VehicleRepositoryImpl implements VehicleRepository {
  constructor(private vehicleApiService: VehicleApiService) {}

  async findAll(): Promise<Vehicle[]> {
    try {
      const apiResponse = await this.vehicleApiService.getVehiclesAsync();
      return VehicleMapper.toDomainList(apiResponse);
    } catch (error) {
      console.error('Error fetching vehicles from API:', error);
      throw new Error('No se pudieron cargar los vehículos desde la API');
    }
  }

  async create(vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle> {
    try {
      const body = VehicleMapper.toApiRequest(vehicle);
      const apiResponse = await this.vehicleApiService.createVehicle(body);
      return VehicleMapper.toDomain(apiResponse);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw new Error('No se pudo crear el vehículo');
    }
  }

  async update(id: string, vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle> {
    try {
      const body = VehicleMapper.toApiRequest(vehicle);
      const apiResponse = await this.vehicleApiService.updateVehicle(id, body);
      return VehicleMapper.toDomain(apiResponse);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw new Error('No se pudo actualizar el vehículo');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.vehicleApiService.deleteVehicle(id);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw new Error('No se pudo eliminar el vehículo');
    }
  }
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npx ng test --include='**/vehicle.repository.impl.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS (4 specs)

- [ ] **Step 6: Commit**

```bash
git add src/app/garage/application/repositories/vehicle.repository.ts src/app/garage/infrastructure/repositories/vehicle.repository.impl.ts src/app/garage/infrastructure/repositories/vehicle.repository.impl.spec.ts
git commit -m "feat(garage): implement create/update/remove in VehicleRepositoryImpl"
```

---

### Task 4: Casos de uso de Vehicles + registro en `garage.providers.ts`

**Files:**
- Create: `src/app/garage/application/use-cases/create-vehicle.usecase.ts`
- Create: `src/app/garage/application/use-cases/update-vehicle.usecase.ts`
- Create: `src/app/garage/application/use-cases/delete-vehicle.usecase.ts`
- Modify: `src/app/garage/garage.providers.ts`

**Interfaces:**
- Consumes: `VehicleRepository.create/update/remove` de [[Task 3]].
- Produces: `CreateVehicleUseCase.execute(vehicle)`, `UpdateVehicleUseCase.execute(id, vehicle)`, `DeleteVehicleUseCase.execute(id)` — quedan disponibles para inyectar desde una futura UI de administración (fuera de alcance de esta fase).

Este task no tiene lógica propia que testear (son wrappers de una línea sobre el repositorio, mismo patrón que `GetVehiclesUseCase` ya existente en este módulo, que tampoco tiene spec dedicado) — se verifica con un build exitoso.

- [ ] **Step 1: Leer `get-vehicles.usecase.ts` como referencia de patrón (no modificar)**

`src/app/garage/application/use-cases/get-vehicles.usecase.ts` ya existe y sigue este patrón: `@Injectable({ providedIn: 'root' })`, inyecta `VehicleRepository` (el token abstracto), expone un método `execute(...)` que delega en el repositorio.

- [ ] **Step 2: Crear `create-vehicle.usecase.ts`**

```typescript
// src/app/garage/application/use-cases/create-vehicle.usecase.ts
import { Injectable } from '@angular/core';
import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleRepository } from '../repositories/vehicle.repository';

@Injectable({ providedIn: 'root' })
export class CreateVehicleUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  execute(vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle> {
    return this.vehicleRepository.create(vehicle);
  }
}
```

- [ ] **Step 3: Crear `update-vehicle.usecase.ts`**

```typescript
// src/app/garage/application/use-cases/update-vehicle.usecase.ts
import { Injectable } from '@angular/core';
import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleRepository } from '../repositories/vehicle.repository';

@Injectable({ providedIn: 'root' })
export class UpdateVehicleUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  execute(id: string, vehicle: Omit<Vehicle, 'id' | 'favorite'>): Promise<Vehicle> {
    return this.vehicleRepository.update(id, vehicle);
  }
}
```

- [ ] **Step 4: Crear `delete-vehicle.usecase.ts`**

```typescript
// src/app/garage/application/use-cases/delete-vehicle.usecase.ts
import { Injectable } from '@angular/core';
import { VehicleRepository } from '../repositories/vehicle.repository';

@Injectable({ providedIn: 'root' })
export class DeleteVehicleUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  execute(id: string): Promise<void> {
    return this.vehicleRepository.remove(id);
  }
}
```

- [ ] **Step 5: Registrar los 3 casos de uso en `garage.providers.ts`**

Agregar los imports y las entradas al arreglo `GARAGE_PROVIDERS` (junto a `GetVehiclesUseCase`):

```typescript
import { CreateVehicleUseCase } from './application/use-cases/create-vehicle.usecase';
import { UpdateVehicleUseCase } from './application/use-cases/update-vehicle.usecase';
import { DeleteVehicleUseCase } from './application/use-cases/delete-vehicle.usecase';
```

```typescript
export const GARAGE_PROVIDERS: Provider[] = [
  MatDialog,
  VehicleApiService,
  FavoriteApiService,
  GetVehiclesUseCase,
  CreateVehicleUseCase,
  UpdateVehicleUseCase,
  DeleteVehicleUseCase,
  FilterVehiclesUseCase,
  ToggleFavoriteUseCase,
  GetUserFavoritesUseCase,
  FavoriteStore,
  {
    provide: VehicleRepository,
    useClass: VehicleRepositoryImpl
  },
  {
    provide: FavoriteRepository,
    useClass: FavoriteRepositoryImpl
  }
];
```

- [ ] **Step 6: Verificar que el proyecto compila**

Run: `npx ng build --configuration development`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 7: Commit**

```bash
git add src/app/garage/application/use-cases/create-vehicle.usecase.ts src/app/garage/application/use-cases/update-vehicle.usecase.ts src/app/garage/application/use-cases/delete-vehicle.usecase.ts src/app/garage/garage.providers.ts
git commit -m "feat(garage): add create/update/delete vehicle use-cases"
```

---

### Task 5: Locations — fix de configuración + documentación PENDIENTE backend

**Files:**
- Modify: `src/environments/environment.prod.ts`
- Modify: `src/app/booking/infraestructure/locations-api-endpoint.ts`

**Interfaces:**
- Ninguna — este task no produce ni consume interfaces de otros tasks de este plan (es documentación + un fix de configuración aislado).

- [ ] **Step 1: Corregir el endpoint de locations en `environment.prod.ts`**

```typescript
// src/environments/environment.prod.ts — cambiar la línea existente
    locations: '/location',
```

(reemplaza el valor actual `'/locations'`, dejándolo igual que `environment.ts` (dev) y que el path real del backend, `/api/v1/location`)

- [ ] **Step 2: Documentar la brecha de backend en `locations-api-endpoint.ts`**

Agregar un comentario de archivo al inicio de la clase, y comentarios puntuales sobre los 3 métodos que llaman a endpoints inexistentes:

```typescript
// src/app/booking/infraestructure/locations-api-endpoint.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocationResponse } from './locations-response';
import { environment } from '../../../environments/environment';

// PENDIENTE backend: el backend real de /api/v1/location solo implementa
// POST (create) y GET (list). getById/update/delete de esta clase llaman
// a endpoints que no existen todavía — quedan aquí sin usar hasta que el
// backend los agregue. El POST real tampoco devuelve el objeto creado
// (responde 201 con body vacío), a diferencia de lo que create() asume.
@Injectable({ providedIn: 'root' })
export class LocationsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.locations}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<LocationResponse[]> {
    return this.http.get<LocationResponse[]>(this.baseUrl);
  }

  create(location: Omit<LocationResponse, 'id'>): Observable<LocationResponse> {
    return this.http.post<LocationResponse>(this.baseUrl, location);
  }

  // PENDIENTE backend: GET /location/{id} no existe en el backend real.
  getById(id: string): Observable<LocationResponse> {
    return this.http.get<LocationResponse>(`${this.baseUrl}/${id}`);
  }

  // PENDIENTE backend: PUT /location/{id} no existe en el backend real.
  update(id: string, location: Partial<LocationResponse>): Observable<LocationResponse> {
    return this.http.patch<LocationResponse>(`${this.baseUrl}/${id}`, location);
  }

  // PENDIENTE backend: DELETE /location/{id} no existe en el backend real.
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

- [ ] **Step 3: Verificar que el proyecto compila**

Run: `npx ng build --configuration production`
Expected: build exitoso (este comando también valida `environment.prod.ts`).

- [ ] **Step 4: Commit**

```bash
git add src/environments/environment.prod.ts src/app/booking/infraestructure/locations-api-endpoint.ts
git commit -m "fix(locations): correct prod endpoint path and document backend gaps"
```

---

### Task 6: Plans — documentación PENDIENTE backend

**Files:**
- Modify: `src/app/plans/infrastructure/plans-api-endpoint.ts`

**Interfaces:**
- Ninguna — documentación aislada, sin cambios de comportamiento.

- [ ] **Step 1: Documentar la brecha de backend sobre `update()`**

```typescript
// src/app/plans/infrastructure/plans-api-endpoint.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Plan } from '../domain/model/plan.entity';
import { PlanResponse } from './plans-response';
import { PlanAssembler } from './plan-assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlansApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.plans}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Plan[]> {
    return this.http.get<PlanResponse[]>(this.baseUrl).pipe(
      map(responses => PlanAssembler.toDomainList(responses))
    );
  }

  getById(id: string): Observable<Plan> {
    return this.http.get<PlanResponse>(`${this.baseUrl}/${id}`).pipe(
      map(response => PlanAssembler.toDomain(response))
    );
  }

  create(plan: Plan): Observable<Plan> {
    return this.http.post<PlanResponse>(this.baseUrl, plan).pipe(
      map(response => PlanAssembler.toDomain(response))
    );
  }

  // PENDIENTE backend: no existe PUT /plans/{id} en el backend real —
  // esta llamada siempre fallará hasta que el backend lo implemente.
  update(id: string, plan: Plan): Observable<Plan> {
    return this.http.put<PlanResponse>(`${this.baseUrl}/${id}`, plan).pipe(
      map(response => PlanAssembler.toDomain(response))
    );
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
git add src/app/plans/infrastructure/plans-api-endpoint.ts
git commit -m "docs(plans): document missing PUT /plans/{id} on the real backend"
```
