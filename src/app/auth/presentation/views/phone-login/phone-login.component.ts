import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { VerificationComponent } from '../verification/verification.component';

@Component({
  selector: 'app-phone-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './phone-login.component.html',
  styleUrl: './phone-login.component.css'
})
export class PhoneLoginComponent {
  private router = inject(Router);
  protected authStore = inject(AuthStore);

  prefix = signal('+51');
  phone = signal('');
  showModal = signal(false);
  verificationCode = signal('');
  copySuccess = signal(false);

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  generateVerificationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  continue() {
    const fullPhone = this.prefix() + this.phone();
    if (fullPhone.length >= 10) {
      this.verificationCode.set(this.generateVerificationCode());
      console.log('Código de verificación:', this.verificationCode());
      this.authStore.sendVerificationCode(fullPhone);
      this.showModal.set(true);
      this.copySuccess.set(false);
    }
  }

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.verificationCode());
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  }

  closeModal() {
    this.showModal.set(false);
  }

  proceedToVerification() {
    this.showModal.set(false);
    this.router.navigate(['/auth/verification'], {
      queryParams: {
        phone: this.prefix() + this.phone(),
        code: this.verificationCode()
      }
    });
  }
}
