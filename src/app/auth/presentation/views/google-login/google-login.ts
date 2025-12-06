import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../application/auth.store';

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-login.html',
  styleUrl: './google-login.css'
})
export class GoogleLogin {
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private loginAttempted = signal(false);

  mockGoogleAccounts = [
    {
      id: 'google_1',
      email: 'usuario@gmail.com',
      name: 'Usuario Demo',
    },
    {
      id: 'google_2',
      email: 'maria.garcia@gmail.com',
      name: 'María García',
    },
    {
      id: 'google_3',
      email: 'juan.perez@gmail.com',
      name: 'Juan Pérez',
    }
  ];

  constructor() {
    // Effect to navigate to home when login is successful
    effect(() => {
      const session = this.authStore.session();
      const error = this.authStore.error();
      const isLoading = this.authStore.isLoading();

      if (this.loginAttempted() && !isLoading) {
        if (session && session.isValid && !session.isGuest && !error) {
          this.router.navigate(['/home']);
          this.loginAttempted.set(false);
        }
      }
    });
  }

  selectGoogleAccount(account: any): void {
    this.loginAttempted.set(true);
    this.authStore.loginWithGoogle(account);
  }

  goBack(): void {
    this.router.navigate(['/auth/login']);
  }
}
