import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

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
});
