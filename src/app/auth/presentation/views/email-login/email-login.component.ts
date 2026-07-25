import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { ProfileStore } from '../../../../profile/application/profile.store';
import { AuthCredentials } from '../../../domain/model/auth-credentials.entity';
import { RegistrationData } from '../../../domain/model/registration-data.entity';

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
  private profileStore = inject(ProfileStore);

  email = signal('');
  password = signal('');
  firstName = signal('');
  lastName = signal('');
  showPassword = signal(false);
  isRegisterMode = signal(false);
  private actionAttempted = signal(false);
  private justRegistered = signal(false);

  constructor() {
    effect(() => {
      const session = this.authStore.session();
      const currentUser = this.authStore.currentUser();
      const error = this.authStore.error();
      const isLoading = this.authStore.isLoading();

      if (!this.actionAttempted() || isLoading) return;

      if (session && session.isValid && !error) {
        if (this.justRegistered()) {
          this.profileStore.createProfile({
            firstName: this.firstName(),
            lastName: this.lastName(),
            email: this.email()
          });
        }
        this.router.navigate(['/home']);
        this.actionAttempted.set(false);
        this.justRegistered.set(false);
        return;
      }

      // El registro exitoso solo crea la cuenta (no devuelve token) —
      // hace falta un sign-in real aparte para obtener la sesión.
      if (this.isRegisterMode() && currentUser && !error && !session && !this.justRegistered()) {
        this.justRegistered.set(true);
        this.authStore.loginWithEmail(new AuthCredentials(this.email(), this.password()));
      }
    });
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
      if (this.email() && this.password() && this.firstName() && this.lastName()) {
        const registrationData = new RegistrationData(
          this.firstName(),
          this.lastName(),
          '',
          this.email(),
          this.password()
        );
        this.actionAttempted.set(true);
        this.authStore.registerUser(registrationData);
      }
    } else {
      if (this.email() && this.password()) {
        this.actionAttempted.set(true);
        this.authStore.loginWithEmail(new AuthCredentials(this.email(), this.password()));
      }
    }
  }
}
