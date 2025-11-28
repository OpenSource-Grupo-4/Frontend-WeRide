import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { AuthCredentials } from '../../../domain/model/auth-credentials.entity';

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
  showPassword = signal(false);

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  continue() {
    if (this.email() && this.password()) {
      const credentials = new AuthCredentials(this.email(), this.password());
      this.authStore.loginWithEmail(credentials);

      setTimeout(() => {
        if (!this.authStore.error()) {
          this.router.navigate(['/home']);
        }
      }, 500);
    }
  }
}
