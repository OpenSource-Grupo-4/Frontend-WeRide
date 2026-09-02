import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { Favorite } from '../domain/model/favorite.model';
import { FavoriteRepository } from './repositories/favorite.repository';

interface FavoriteState {
  favorites: Favorite[];
  favoriteVehicleIds: string[];
  isLoading: boolean;
  error: string | null;
}

// Helper functions for localStorage
function loadFavoritesFromLocalStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('favoriteVehicleIds');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading favorites from localStorage:', error);
    return [];
  }
}

function saveFavoritesToLocalStorage(vehicleIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('favoriteVehicleIds', JSON.stringify(vehicleIds));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
}

const initialState: FavoriteState = {
  favorites: [],
  favoriteVehicleIds: loadFavoritesFromLocalStorage(),
  isLoading: false,
  error: null
};

export const FavoriteStore = signalStore(
  withState(initialState),
  withMethods((store) => {
    const favoriteRepository = inject(FavoriteRepository);

    return {
      loadUserFavorites: rxMethod<string>(
        pipe(
          tap(() => {
            patchState(store, { isLoading: true, error: null });
          }),
          switchMap((userId) => {
            return favoriteRepository.getUserFavorites(userId).pipe(
              tap((favorites) => {
                const favoriteVehicleIds = favorites.map(fav => fav.vehicleId);
                // Save to localStorage
                saveFavoritesToLocalStorage(favoriteVehicleIds);
                patchState(store, {
                  favorites,
                  favoriteVehicleIds,
                  isLoading: false,
                  error: null
                });
              }),
              catchError((error) => {
                console.error('✗ Error loading favorites:', error);
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Error al cargar favoritos'
                });
                return of(null);
              })
            );
          })
        )
      ),

      addFavorite: rxMethod<{ userId: string; vehicleId: string; notes?: string }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ userId, vehicleId, notes }) =>
            favoriteRepository.addFavorite(userId, vehicleId, notes).pipe(
              tap((newFavorite) => {
                const updatedFavorites = [...store.favorites(), newFavorite];
                const updatedIds = [...store.favoriteVehicleIds(), vehicleId];
                // Save to localStorage
                saveFavoritesToLocalStorage(updatedIds);
                patchState(store, {
                  favorites: updatedFavorites,
                  favoriteVehicleIds: updatedIds,
                  isLoading: false,
                  error: null
                });
              }),
              catchError((error) => {
                console.error('✗ Error adding favorite:', error);
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Error al agregar favorito'
                });
                return of(null);
              })
            )
          )
        )
      ),

      removeFavorite: rxMethod<{ userId: string; vehicleId: string }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ userId, vehicleId }) => {
            // Find the favorite to remove
            const favoriteToRemove = store.favorites().find(
              fav => fav.userId === userId && fav.vehicleId === vehicleId
            );

            if (!favoriteToRemove) {
              patchState(store, { isLoading: false });
              return of(null);
            }

            return favoriteRepository.removeFavorite(favoriteToRemove.id).pipe(
              tap(() => {
                const updatedFavorites = store.favorites().filter(
                  fav => fav.id !== favoriteToRemove.id
                );
                const updatedIds = updatedFavorites.map(fav => fav.vehicleId);
                // Save to localStorage
                saveFavoritesToLocalStorage(updatedIds);
                patchState(store, {
                  favorites: updatedFavorites,
                  favoriteVehicleIds: updatedIds,
                  isLoading: false,
                  error: null
                });
              }),
              catchError((error) => {
                console.error('✗ Error removing favorite:', error);
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Error al eliminar favorito'
                });
                return of(null);
              })
            );
          })
        )
      ),

      toggleFavorite: rxMethod<{ userId: string; vehicleId: string }>(
        pipe(
          switchMap(({ userId, vehicleId }) => {
            const isFavorite = store.favoriteVehicleIds().includes(vehicleId);

            if (isFavorite) {
              // Remove from favorites
              const favoriteToRemove = store.favorites().find(
                fav => fav.userId === userId && fav.vehicleId === vehicleId
              );

              if (!favoriteToRemove) {
                // After a reload, `favoriteVehicleIds` is hydrated from
                // localStorage but `favorites` is empty (it is only populated
                // by in-session add successes), so the Favorite id — required
                // by removeFavorite(id) → DELETE /favorites/{id} — is unknown
                // here. Best effort: drop the vehicle from favoriteVehicleIds +
                // localStorage so the UI un-favorites instead of silently
                // no-opping; deleting the server record (if any) needs a full
                // favorites refresh first so the id can be resolved.
                console.warn(
                  'Favorite not found in store; removed locally. ' +
                    'Server sync requires loadUserFavorites before removal.',
                  { userId, vehicleId }
                );
                const updatedIds = store.favoriteVehicleIds().filter(
                  id => id !== vehicleId
                );
                // Save to localStorage
                saveFavoritesToLocalStorage(updatedIds);
                patchState(store, {
                  favoriteVehicleIds: updatedIds,
                  error: null
                });
                return of(null);
              }

              return favoriteRepository.removeFavorite(favoriteToRemove.id).pipe(
                tap(() => {
                  const updatedFavorites = store.favorites().filter(
                    fav => fav.id !== favoriteToRemove.id
                  );
                  const updatedIds = updatedFavorites.map(fav => fav.vehicleId);
                  // Save to localStorage
                  saveFavoritesToLocalStorage(updatedIds);
                  patchState(store, {
                    favorites: updatedFavorites,
                    favoriteVehicleIds: updatedIds,
                    error: null
                  });
                }),
                catchError((error) => {
                  console.error('✗ Error removing favorite:', error);
                  patchState(store, {
                    isLoading: false,
                    error: error.message || 'Error al eliminar favorito'
                  });
                  return of(null);
                })
              );
            } else {
              // Add to favorites
              return favoriteRepository.addFavorite(userId, vehicleId).pipe(
                tap((newFavorite) => {
                  const updatedFavorites = [...store.favorites(), newFavorite];
                  const updatedIds = [...store.favoriteVehicleIds(), vehicleId];
                  // Save to localStorage
                  saveFavoritesToLocalStorage(updatedIds);
                  patchState(store, {
                    favorites: updatedFavorites,
                    favoriteVehicleIds: updatedIds,
                    error: null
                  });
                }),
                catchError((error) => {
                  console.error('✗ Error adding favorite:', error);
                  patchState(store, {
                    isLoading: false,
                    error: error.message || 'Error al agregar favorito'
                  });
                  return of(null);
                })
              );
            }
          })
        )
      ),

      isFavorite(vehicleId: string): boolean {
        return store.favoriteVehicleIds().includes(vehicleId);
      },

      clearError() {
        patchState(store, { error: null });
      },

      reset() {
        patchState(store, initialState);
      }
    };
  })
);
