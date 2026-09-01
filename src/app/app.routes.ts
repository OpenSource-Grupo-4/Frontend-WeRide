import { Routes } from '@angular/router';
import { LayoutComponent } from './public/components/layout/layout';
import { BOOKING_ROUTES } from './booking/presentation/views/booking.routes';
import { TRIP_ROUTES } from './trip/presentation/views/trip.routes';
import { PLAN_ROUTES } from './plans/presentation/views/plan.routes';
import { GARAGE_ROUTES } from './garage/garage.routes';
import { USER_ROUTES } from './user/user.routes';
import { AUTH_ROUTES } from './auth/auth.routes';
import { authGuard, sessionGuard } from './auth/infrastructure/auth.guard';
import { NotFoundComponent } from './public/pages/not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: AUTH_ROUTES
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [sessionGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./public/components/home/home').then(m => m.Home)
      },
      {
        path: 'vehicle-status',
        canActivate: [authGuard],
        loadComponent: () => import('./booking/presentation/views/vehicle-unlock-status/vehicle-unlock-status').then(m => m.VehicleUnlockStatusComponent)
      },
      {
        path: 'schedule-unlock',
        canActivate: [authGuard],
        loadComponent: () => import('./booking/presentation/views/schedule-unlock/schedule-unlock').then(m => m.ScheduleUnlockComponent)
      },
      {
        path: 'trip',
        canActivate: [authGuard],
        children: TRIP_ROUTES
      },
      {
        path: 'booking',
        canActivate: [authGuard],
        children: BOOKING_ROUTES
      },
      {
        path: 'plan',
        canActivate: [authGuard],
        children: PLAN_ROUTES
      },
      {
        path: 'garage',
        canActivate: [authGuard],
        children: GARAGE_ROUTES
      },
      {
        path: 'user',
        canActivate: [authGuard],
        children: USER_ROUTES
      }
    ]
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
