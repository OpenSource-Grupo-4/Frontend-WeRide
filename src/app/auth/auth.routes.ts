import { Routes } from '@angular/router';
import { LoginComponent } from './presentation/views/login/login.component';
import { VerificationComponent } from './presentation/views/verification/verification.component';
import { RegisterComponent } from './presentation/views/register/register.component';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'verification', component: VerificationComponent },
  { path: 'register', component: RegisterComponent }
];
