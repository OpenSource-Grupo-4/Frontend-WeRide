import { Routes } from '@angular/router';
import { Home } from './public/components/home/home';
import { BOOKING_ROUTES } from './booking/presentation/views/booking.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: Home
  },
  {
    path: 'vehicle-status',
    loadComponent: () => import('./booking/presentation/views/vehicle-unlock-status/vehicle-unlock-status').then(m => m.VehicleUnlockStatusComponent)
  },
  {
    path: 'schedule-unlock',
    loadComponent: () => import('./booking/presentation/views/schedule-unlock/schedule-unlock').then(m => m.ScheduleUnlockComponent)
  },
  {
    path: 'booking',
    children: BOOKING_ROUTES
  }
];
