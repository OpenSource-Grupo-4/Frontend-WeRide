import { Component, inject } from '@angular/core';
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

  selectGoogleAccount(account: any): void {
    this.authStore.loginWithGoogle(account);
    this.router.navigate(['/home']);
  }

  goBack(): void {
    this.router.navigate(['/auth/login']);
  }
}
