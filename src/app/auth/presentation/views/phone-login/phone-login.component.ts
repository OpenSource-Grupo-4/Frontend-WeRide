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

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  continue() {
    const fullPhone = this.prefix() + this.phone();
    if (fullPhone.length >= 10) {
      this.authStore.sendVerificationCode(fullPhone);
      this.router.navigate(['/auth/verification'], {
        queryParams: { phone: fullPhone }
      });
    }
  }
}
