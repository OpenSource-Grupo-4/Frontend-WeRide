import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../application/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private router = inject(Router);
  private authStore = inject(AuthStore);

  navigateToPhoneLogin() {
    this.router.navigate(['/auth/phone-login']);
  }

  navigateToEmailLogin() {
    this.router.navigate(['/auth/email-login']);
  }

  loginWithGoogle() {
    console.log('Login with Google');
  }

  loginAsGuest() {
    this.authStore.loginAsGuest();
    this.router.navigate(['/home']);
  }
}
