import { Routes } from '@angular/router';
import { LoginComponent } from './presentation/views/login/login.component';
import { PhoneLoginComponent } from './presentation/views/phone-login/phone-login.component';
import { VerificationComponent } from './presentation/views/verification/verification.component';
import { RegisterComponent } from './presentation/views/register/register.component';
import { EmailLoginComponent } from './presentation/views/email-login/email-login.component';
import {GoogleLogin} from './presentation/views/google-login/google-login';


export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'google-login', component: GoogleLogin},
  { path: 'phone-login', component: PhoneLoginComponent },
  { path: 'email-login', component: EmailLoginComponent },
  { path: 'verification', component: VerificationComponent },
  { path: 'register', component: RegisterComponent }
];
