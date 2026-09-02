import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { PhoneCredentials } from '../../../domain/model/phone-credentials.entity';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.css'
})
export class VerificationComponent implements OnInit {
  private router = inject(Router);
  protected authStore = inject(AuthStore);
  private translate = inject(TranslateService);

  phone = signal('');
  expectedCode = signal('');
  code = signal(['', '', '', '']);
  errorMessage = signal('');
  private loginAttempted = signal(false);

  constructor() {
    // Effect to react to the store result of loginWithPhone: navigate to /home
    // on success and surface the store error (e.g. 'Otp Invalido') to the user.
    effect(() => {
      const session = this.authStore.session();
      const error = this.authStore.error();
      const isLoading = this.authStore.isLoading();

      if (!this.loginAttempted() || isLoading) return;

      if (session && session.isValid && !error) {
        this.router.navigate(['/home']);
        this.loginAttempted.set(false);
        return;
      }

      if (error) {
        this.errorMessage.set(this.translate.instant('errors.invalidCode'));
        this.loginAttempted.set(false);
      }
    });
  }

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { phone?: string; code?: string } | null;

    const phone = state?.phone || '';
    const code = state?.code || this.authStore.verificationCode() || '';

    if (!phone || !code) {
      this.router.navigate(['/auth/phone-login']);
      return;
    }

    this.phone.set(phone);
    this.expectedCode.set(code);
  }

  onCodeInput(index: number, event: any) {
    const value = event.target.value;
    const updatedCode = [...this.code()];
    updatedCode[index] = value;
    this.code.set(updatedCode);

    if (value && index < 3) {
      const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"]');
      inputs[index + 1]?.focus();
    }
    this.checkCode();
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';

    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('');
      this.code.set(digits);

      const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"]');
      inputs[3]?.focus();

      this.checkCode();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.code()[index] && index > 0) {
      const prevInput = document.querySelectorAll('input')[index - 1] as HTMLInputElement;
      prevInput?.focus();
    }
  }

  checkCode() {
    const enteredCode = this.code().join('');
    if (enteredCode.length === 4) {
      if (enteredCode === this.expectedCode()) {
        this.login();
      } else {
        this.errorMessage.set(this.translate.instant('errors.invalidCode'));
        setTimeout(() => this.errorMessage.set(''), 3000);
      }
    }
  }

  continue() {
    const enteredCode = this.code().join('');
    if (enteredCode.length === 4) {
      this.checkCode();
    }
  }

  login() {
    const enteredCode = this.code().join('');

    const credentials: PhoneCredentials = {
      phone: this.phone(),
      verificationCode: enteredCode
    };

    this.loginAttempted.set(true);
    this.authStore.loginWithPhone(credentials);
  }

  goBack() {
    this.router.navigate(['/auth/phone-login']);
  }
}
