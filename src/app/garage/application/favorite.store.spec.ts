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
  }) {
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
    const removeFavorite = jasmine.createSpy('removeFavorite').and.returnValue(of(undefined));
    const store = setup({
      addFavorite: jasmine.createSpy('addFavorite').and.returnValue(of(createFavorite('v1'))),
      removeFavorite
    });

    // Favorite added in a previous session (user-1) and persisted to localStorage.
    store.toggleFavorite({ userId: 'user-1', vehicleId: 'v1' });
    tick();
    expect(store.favoriteVehicleIds()).toContain('v1');
    expect(store.favorites().length).toBe(1);

    // After a reload `favoriteVehicleIds` is hydrated from localStorage while
    // `favorites` holds no matching Favorite object (favorites is only
    // populated by in-session adds). Toggling must still un-favorite the
    // vehicle instead of silently no-opping: drop the id + localStorage, and
    // do not attempt a server delete that cannot be addressed without an id.
    store.toggleFavorite({ userId: 'user-2', vehicleId: 'v1' });
    tick();

    expect(store.favoriteVehicleIds()).not.toContain('v1');
    expect(JSON.parse(localStorage.getItem('favoriteVehicleIds') || '[]')).not.toContain('v1');
    expect(removeFavorite).not.toHaveBeenCalled();
    expect(store.error()).toBeNull();
  }));
});
