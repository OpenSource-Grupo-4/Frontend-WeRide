import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { LoginWithPhoneUseCase } from '../../../application/login-with-phone.use-case';
import { PhoneCredentials } from '../../../domain/model/phone-credentials.entity';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.css'
})
export class VerificationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected authStore = inject(AuthStore);
  private loginUseCase = inject(LoginWithPhoneUseCase);
  private translate = inject(TranslateService);

  phone = signal('');
  expectedCode = signal('');
  code = signal(['', '', '', '']);
  errorMessage = signal('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.phone.set(params['phone'] || '');
      this.expectedCode.set(params['code'] || '');
    });
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

    this.loginUseCase.execute(credentials).subscribe({
      next: (session) => {
        this.authStore.setSession(session);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.errorMessage.set(this.translate.instant('errors.loginError') + ': ' + (err.message || this.translate.instant('errors.invalidCode')));
        console.error('Error de autenticación:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/auth/phone-login']);
  }
}
