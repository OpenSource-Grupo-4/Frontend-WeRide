import { Routes } from '@angular/router';
import { GARAGE_PROVIDERS } from './garage.providers';

export const GARAGE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/views/garage-layout/garage-layout').then(m => m.GarageLayout),
    providers: GARAGE_PROVIDERS
  }
];
