import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { AuthCredentials } from '../../../domain/model/auth-credentials.entity';
import { RegistrationData } from '../../../domain/model/registration-data.entity';
import { User } from '../../../domain/model/user.entity';
import { AuthSession } from '../../../domain/model/auth-session.entity';

@Component({
  selector: 'app-email-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './email-login.component.html',
  styleUrl: './email-login.component.css'
})
export class EmailLoginComponent {
  private router = inject(Router);
  protected authStore = inject(AuthStore);

  email = signal('');
  password = signal('');
  firstName = signal('');
  lastName = signal('');
  showPassword = signal(false);
  isRegisterMode = signal(false);
  private actionAttempted = signal(false);

  constructor() {
    // Effect to navigate to home when login/register is successful
    effect(() => {
      const session = this.authStore.session();
      const currentUser = this.authStore.currentUser();
      const error = this.authStore.error();
      const isLoading = this.authStore.isLoading();

      if (this.actionAttempted() && !isLoading) {
        // Si hay sesión válida, redirigir
        if (session && session.isValid && !error) {
          this.router.navigate(['/home']);
          this.actionAttempted.set(false);
        }
        // Si se registró un usuario pero no hay sesión, crear sesión automáticamente
        else if (this.isRegisterMode() && currentUser && !error && !session) {
          this.createSessionForRegisteredUser(currentUser);
        }
      }
    });
  }

  private createSessionForRegisteredUser(user: User) {
    // Crear sesión para el usuario registrado
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const token = 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    const session = new AuthSession(user, token, expiresAt, false);

    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_session', JSON.stringify({
        user: user,
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        isGuest: false
      }));
    }

    // Establecer sesión en el store
    this.authStore.setSession(session);
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  toggleMode() {
    this.isRegisterMode.set(!this.isRegisterMode());
    this.email.set('');
    this.password.set('');
    this.firstName.set('');
    this.lastName.set('');
    this.authStore.clearError();
  }

  continue() {
    if (this.isRegisterMode()) {
      // Modo registro
      if (this.email() && this.password() && this.firstName() && this.lastName()) {
        const registrationData = new RegistrationData(
          this.firstName(),
          this.lastName(),
          '', // phone no requerido para email
          this.email()
        );
        this.actionAttempted.set(true);
        this.authStore.registerUser(registrationData);
      }
    } else {
      // Modo inicio de sesión - acepta cualquier credencial
      if (this.email() && this.password()) {
        this.loginWithAnyCredentials();
      }
    }
  }

  private loginWithAnyCredentials() {
    // Crear un usuario temporal con las credenciales proporcionadas
    const tempUser = new User(
      `temp-${Date.now()}`,
      this.email().split('@')[0] || 'Usuario',
      this.email(),
      '',
      'basic-plan-001',
      true,
      'assets/users/default.jpg',
      '',
      '',
      '',
      'verified',
      new Date().toISOString(),
      {
        language: 'es',
        notifications: true,
        theme: 'light'
      },
      {
        totalTrips: 0,
        totalDistance: 0,
        totalSpent: 0,
        averageRating: 0
      }
    );

    // Crear sesión directamente
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const token = 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    const session = new AuthSession(tempUser, token, expiresAt, false);

    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_session', JSON.stringify({
        user: tempUser,
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        isGuest: false
      }));
    }

    // Establecer sesión en el store
    this.authStore.setSession(session);
    this.actionAttempted.set(true);
  }
}
