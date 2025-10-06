import { Routes } from '@angular/router';
import { Home } from './public/components/home/home';
import { BOOKING_ROUTES } from './booking/presentation/views/booking.routes';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./public/components/home-page/home-page').then(m => m.HomePageComponent)
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
    ]
  }
];
