import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  private translate = inject(TranslateService);

  prefix = signal('+51');
  phone = signal('');
  showModal = signal(false);
  copySuccess = signal(false);
  phoneError = signal('');

  readonly storeVerificationCode = this.authStore.verificationCode;

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  isPhoneInvalid(): boolean {
    return this.phoneError() !== '';
  }

  continue() {
    if (this.phone().length < 9) {
      this.phoneError.set(this.translate.instant('validation.required'));
      return;
    }

    this.phoneError.set('');
    const fullPhone = this.prefix() + this.phone();
    if (fullPhone.length >= 10) {
      this.authStore.sendVerificationCode(fullPhone);
      this.showModal.set(true);
      this.copySuccess.set(false);
    }
  }

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.storeVerificationCode() ?? '');
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
      state: {
        phone: this.prefix() + this.phone(),
        code: this.storeVerificationCode()
      }
    });
  }
}
