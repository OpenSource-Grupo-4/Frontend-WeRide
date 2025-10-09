import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../application/auth.store';
import { PhoneCredentials } from '../../../domain/model/phone-credentials.entity';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.css'
})
export class VerificationComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected authStore = inject(AuthStore);

  phone = signal('');
  code = signal(['', '', '', '']);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.phone.set(params['phone'] || '');
    });
  }

  goBack() {
    this.router.navigate(['/auth/phone-login']);
  }

  onCodeInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value.length === 1 && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    const newCode = [...this.code()];
    newCode[index] = value;
    this.code.set(newCode);
  }

  onKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.code()[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  }

  continue() {
    const verificationCode = this.code().join('');
    if (verificationCode.length === 4) {
      const credentials = new PhoneCredentials(this.phone(), verificationCode);
      this.authStore.loginWithPhone(credentials);

      setTimeout(() => {
        if (this.authStore.error()) {
          console.error(this.authStore.error());
        } else {
          this.router.navigate(['/auth/register'], {
            queryParams: { phone: this.phone() }
          });
        }
      }, 500);
    }
  }
}
