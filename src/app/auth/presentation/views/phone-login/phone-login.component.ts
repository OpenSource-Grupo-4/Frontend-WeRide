import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../application/auth.store';

@Component({
  selector: 'app-phone-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  enteredCode = signal('');
  errorMessage = signal('');

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  continue() {
    const fullPhone = this.prefix() + this.phone();
    if (fullPhone.length >= 10) {
      this.verificationCode.set(this.generateVerificationCode());
      console.log('Código de verificación:', this.verificationCode());
      this.authStore.sendVerificationCode(fullPhone);
      this.showModal.set(true);
    }
  }

  verifyCode() {
    if (this.enteredCode() === this.verificationCode()) {
      this.showModal.set(false);
      this.router.navigate(['/auth/verification'], {
        queryParams: { phone: this.prefix() + this.phone() }
      });
    } else {
      this.errorMessage.set('Código incorrecto. Inténtalo de nuevo.');
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.enteredCode.set('');
    this.errorMessage.set('');
  }

  resendCode() {
    this.verificationCode.set(this.generateVerificationCode());
    console.log('Nuevo código de verificación:', this.verificationCode());
    this.errorMessage.set('');
    this.enteredCode.set('');
  }
}
