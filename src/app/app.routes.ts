import { Routes } from '@angular/router';
import { Home } from './public/components/home/home';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'garage',
    loadComponent: () =>
      import('./garage/ui/garage/garage.component').then(m => m.GarageComponent)
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./garage/ui/favorites/favorites.component').then(m => m.FavoritesComponent)
  },
  { path: '**', redirectTo: '' }
];
