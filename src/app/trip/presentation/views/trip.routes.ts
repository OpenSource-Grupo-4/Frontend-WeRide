import { Routes } from '@angular/router';

export const TRIP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'details',
    pathMatch: 'full'
  },
  {
    path: 'details',
    loadComponent: () => import('./trip-details/trip-details').then(m => m.TripDetails)
  }
];
