import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { FavoriteStore } from './favorite.store';
import { FavoriteRepository } from './repositories/favorite.repository';
import { Favorite } from '../domain/model/favorite.model';

function createFavorite(vehicleId: string): Favorite {
  return {
    id: `fav-${vehicleId}`,
    userId: 'user-1',
    vehicleId,
    addedAt: new Date('2025-01-01T00:00:00Z')
  };
}

describe('FavoriteStore', () => {
  function setup(repo: {
    getUserFavorites?: jasmine.Spy;
    addFavorite?: jasmine.Spy;
    removeFavorite?: jasmine.Spy;
    isFavorite?: jasmine.Spy;
  } = {}) {
    TestBed.configureTestingModule({
      providers: [
        FavoriteStore,
        {
          provide: FavoriteRepository,
          useValue: {
            getUserFavorites: repo.getUserFavorites ?? jasmine.createSpy('getUserFavorites').and.returnValue(of([])),
            addFavorite: repo.addFavorite ?? jasmine.createSpy('addFavorite').and.returnValue(of(createFavorite('v1'))),
            removeFavorite: repo.removeFavorite ?? jasmine.createSpy('removeFavorite').and.returnValue(of(undefined)),
            isFavorite: repo.isFavorite ?? jasmine.createSpy('isFavorite').and.returnValue(of(false))
          }
        }
      ]
    });
    // Reset any state persisted by previous specs (initial state reads localStorage).
    localStorage.removeItem('favoriteVehicleIds');
    return TestBed.inject(FavoriteStore);
  }

  it('patches error when addFavorite fails inside toggleFavorite', fakeAsync(() => {
    const store = setup({
      addFavorite: jasmine.createSpy('addFavorite').and.returnValue(
        throwError(() => new Error('API down'))
      )
    });

    expect(store.error()).toBeNull();
    // Vehicle 'v1' is NOT a favorite yet → the add branch runs and fails.
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();

    expect(store.error()).toContain('API down');
    expect(store.favoriteVehicleIds()).not.toContain('v1');
  }));

  it('patches error when removeFavorite fails inside toggleFavorite', fakeAsync(() => {
    const store = setup({
      getUserFavorites: jasmine.createSpy('getUserFavorites').and.returnValue(of([createFavorite('v1')])),
      removeFavorite: jasmine.createSpy('removeFavorite').and.returnValue(
        throwError(() => new Error('API down'))
      )
    });
    // Seed an existing favorite in the store so the remove branch runs.
    store.loadUserFavorites('user-1');
    tick();
    expect(store.favoriteVehicleIds()).toContain('v1');

    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();

    expect(store.error()).toContain('API down');
    expect(store.favoriteVehicleIds()).toContain('v1'); // no partial state
  }));

  it('keeps the favorite and reports an error when resolving the server favorite fails', fakeAsync(() => {
    const store = setup({
      getUserFavorites: jasmine.createSpy('getUserFavorites').and.returnValue(
        throwError(() => new Error('API down'))
      )
    });
    // add en sesión de user-1 deja v1 en favoriteVehicleIds; toggle de user-2
    // cae en la rama degradada (sin Favorite en memoria que empareje).
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();
    store.toggleFavorite({ userId: 'user-2', vehicleId: 'v1' });
    tick();

    expect(store.error()).toContain('API down');
    expect(store.favoriteVehicleIds()).toContain('v1'); // no se des-favoritó
    expect(store.isLoading()).toBeFalse();
  }));

  it('reports an error and keeps state when the resolved remote delete fails', fakeAsync(() => {
    const store = setup({
      getUserFavorites: jasmine.createSpy('getUserFavorites').and.returnValue(
        of([createFavorite('v1')])
      ),
      removeFavorite: jasmine.createSpy('removeFavorite').and.returnValue(
        throwError(() => new Error('API down'))
      )
    });
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();
    store.toggleFavorite({ userId: 'user-2', vehicleId: 'v1' });
    tick();

    expect(store.error()).toContain('API down');
    expect(store.favoriteVehicleIds()).toContain('v1');
    expect(store.isLoading()).toBeFalse();
  }));

  it('toggles successfully when the API call succeeds', fakeAsync(() => {
    const store = setup({
      addFavorite: jasmine.createSpy('addFavorite').and.returnValue(of(createFavorite('v1')))
    });

    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();

    expect(store.error()).toBeNull();
    expect(store.favoriteVehicleIds()).toContain('v1');
  }));

  it('clears a stale error when a retried toggle succeeds', fakeAsync(() => {
    const addFavorite = jasmine.createSpy('addFavorite');
    let shouldFail = true;
    addFavorite.and.callFake(() => {
      if (shouldFail) {
        shouldFail = false;
        return throwError(() => new Error('API down'));
      }
      return of(createFavorite('v1'));
    });
    const store = setup({ addFavorite });

    // First attempt fails and leaves the error set.
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();
    expect(store.error()).toContain('API down');

    // Retry succeeds: the stale error must be cleared so vehicle-card's
    // delayed check does not roll back a successful toggle.
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();

    expect(store.error()).toBeNull();
    expect(store.favoriteVehicleIds()).toContain('v1');
    expect(store.favorites().length).toBe(1);
  }));

  it('clears a previous toggle error at the start of a new toggle', fakeAsync(() => {
    // First toggle fails; the second stays in flight (deferred) so we can assert
    // the leading tap cleared the stale error before any result arrives.
    const pending = new Subject<Favorite>();
    const addFavorite = jasmine.createSpy('addFavorite');
    addFavorite.and.callFake(() => {
      if (!addFavorite.calls.any() || addFavorite.calls.count() === 1) {
        // First call fails.
        return throwError(() => new Error('API down'));
      }
      // Second call stays pending.
      return pending;
    });
    const store = setup({ addFavorite });

    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();
    expect(store.error()).toContain('API down');

    // A new toggle must clear the previous toggle's error immediately, so
    // vehicle-card's delayed error check cannot read a stale error and roll
    // back a toggle that belongs to a different card/attempt.
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    expect(store.error()).toBeNull();

    pending.next(createFavorite('v1'));
    pending.complete();
    tick();
    expect(store.error()).toBeNull();
    expect(store.favoriteVehicleIds()).toContain('v1');
  }));

  it('removing a favorite not in the in-memory favorites list still removes it from favoriteVehicleIds and localStorage', fakeAsync(() => {
    const getUserFavorites = jasmine.createSpy('getUserFavorites').and.returnValue(of([]));
    const removeFavorite = jasmine.createSpy('removeFavorite').and.returnValue(of(undefined));
    const store = setup({
      addFavorite: jasmine.createSpy('addFavorite').and.returnValue(of(createFavorite('v1'))),
      getUserFavorites,
      removeFavorite
    });

    // Favorite added in a previous session (user-1) and persisted to localStorage.
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();
    expect(store.favoriteVehicleIds()).toContain('v1');
    expect(store.favorites().length).toBe(1);

    // After a reload `favoriteVehicleIds` is hydrated from localStorage while
    // `favorites` holds no matching Favorite object (favorites is only
    // populated by in-session adds). El toggle ya no degrada a borrado local
    // silencioso: primero resuelve la fila del servidor (getUserFavorites) y,
    // como el servidor ya no tiene el favorito ([]), no emite DELETE: solo
    // limpia el id + localStorage.
    store.toggleFavorite({ userId: 'user-2', vehicleId: 'v1' });
    tick();

    expect(getUserFavorites).toHaveBeenCalledWith('user-2');
    expect(store.favoriteVehicleIds()).not.toContain('v1');
    expect(JSON.parse(localStorage.getItem('favoriteVehicleIds') || '[]')).not.toContain('v1');
    expect(removeFavorite).not.toHaveBeenCalled();
    expect(store.error()).toBeNull();
  }));

  it('turns isLoading off after a successful add inside toggleFavorite', fakeAsync(() => {
    // Deferred observable so the in-flight loading state is observable before
    // the synchronous `of(...)` completion would flip it straight back.
    const addFavorite$ = new Subject<Favorite>();
    const store = setup({
      addFavorite: jasmine.createSpy('addFavorite').and.returnValue(addFavorite$)
    });

    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    expect(store.isLoading()).toBeTrue();

    addFavorite$.next(createFavorite('v1'));
    addFavorite$.complete();
    tick();

    expect(store.isLoading()).toBeFalse();
    expect(store.favoriteVehicleIds()).toContain('v1');
  }));

  it('turns isLoading off after a successful remove inside toggleFavorite', fakeAsync(() => {
    const removeFavorite$ = new Subject<void>();
    const store = setup({
      getUserFavorites: jasmine.createSpy('getUserFavorites').and.returnValue(of([createFavorite('v1')])),
      removeFavorite: jasmine.createSpy('removeFavorite').and.returnValue(removeFavorite$)
    });
    store.loadUserFavorites('user-1');
    tick();
    expect(store.favoriteVehicleIds()).toContain('v1');

    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    expect(store.isLoading()).toBeTrue();

    removeFavorite$.next();
    removeFavorite$.complete();
    tick();

    expect(store.isLoading()).toBeFalse();
    expect(store.favoriteVehicleIds()).not.toContain('v1');
  }));

  it('turns isLoading off when removing a favorite that only exists in localStorage (no in-memory Favorite)', fakeAsync(() => {
    // Escenario real: favoriteVehicleIds contiene 'v1' porque un add en sesión
    // de user-1 lo dejó ahí, pero favorites() no contiene ningún Favorite que
    // empareje (userId: 'user-2', vehicleId: 'v1') — el estado análogo al de
    // un post-reload, con ids presentes pero sin Favorite en memoria — así que
    // el toggle cae en la rama degradada `if (!favoriteToRemove)`, que debe
    // apagar isLoading.
    //
    // initialState.favoriteVehicleIds se lee de localStorage una sola vez, al
    // importar el módulo (favorite.store.ts:36-41), así que en el harness el
    // desajuste ids-sin-Favorite no puede venir de una recarga real: se
    // reproduce con un add en sesión bajo otro userId. user-1 añade 'v1' (su
    // Favorite queda en memoria con userId 'user-1') y el toggle de user-2
    // sobre 'v1' no encuentra ningún Favorite que coincida con su par
    // (userId, vehicleId).
    const store = setup();
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();
    expect(store.favoriteVehicleIds()).toContain('v1');
    expect(store.favorites().length).toBe(1);

    store.toggleFavorite({ userId: 'user-2', vehicleId: 'v1' });
    tick();

    expect(store.isLoading()).toBeFalse();
    expect(store.favoriteVehicleIds()).not.toContain('v1');
  }));

  it('resolves the server favorite id after a reload-like state and removes it remotely', fakeAsync(() => {
    const getUserFavorites = jasmine.createSpy('getUserFavorites').and.returnValue(
      of([createFavorite('v1')])
    );
    const removeFavorite = jasmine.createSpy('removeFavorite').and.returnValue(of(undefined));
    const store = setup({ getUserFavorites, removeFavorite });

    // Estado análogo al post-reload: 'v1' está en favoriteVehicleIds (add en
    // sesión de user-1) pero el toggle es de user-2, sin Favorite en memoria
    // que empareje → rama degradada.
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();
    expect(store.favoriteVehicleIds()).toContain('v1');

    store.toggleFavorite({ userId: 'user-2', vehicleId: 'v1' });
    tick();

    expect(getUserFavorites).toHaveBeenCalledWith('user-2');
    expect(removeFavorite).toHaveBeenCalledWith('fav-v1');
    expect(store.favoriteVehicleIds()).not.toContain('v1');
    expect(store.isLoading()).toBeFalse();
  }));

  it('only clears local state when the server no longer has the favorite', fakeAsync(() => {
    const getUserFavorites = jasmine.createSpy('getUserFavorites').and.returnValue(of([]));
    const removeFavorite = jasmine.createSpy('removeFavorite').and.returnValue(of(undefined));
    const store = setup({ getUserFavorites, removeFavorite });

    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();
    store.toggleFavorite({ userId: 'user-2', vehicleId: 'v1' });
    tick();

    expect(getUserFavorites).toHaveBeenCalledWith('user-2');
    expect(removeFavorite).not.toHaveBeenCalled();
    expect(store.favoriteVehicleIds()).not.toContain('v1');
    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBeNull();
  }));
});
