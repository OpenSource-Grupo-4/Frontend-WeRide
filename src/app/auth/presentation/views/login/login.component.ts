import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { DataInitService } from '../../../../core/services/data-init.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private dataInitService = inject(DataInitService);
  private translate = inject(TranslateService);

  dataLoaded = false;
  loadingMessage = '';
  guestError = signal('');
  private guestLoginAttempted = signal(false);

  constructor() {
    // Effect to navigate to home when guest login is successful
    effect(() => {
      const session = this.authStore.session();
      const error = this.authStore.error();
      const isLoading = this.authStore.isLoading();

      if (this.guestLoginAttempted() && !isLoading) {
        if (session && session.isValid && !error) {
          this.router.navigate(['/home']);
          this.guestLoginAttempted.set(false);
        } else if (error) {
          this.guestError.set(error);
          this.guestLoginAttempted.set(false);
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.translate.get('auth.login.loadingMessage').subscribe(msg => {
      this.loadingMessage = msg;
    });
    await this.dataInitService.initializeData();

    this.dataInitService.dataLoaded$.subscribe(loaded => {
      this.dataLoaded = loaded;
    });
  }

  navigateToPhoneLogin() {
    this.router.navigate(['/auth/phone-login']);
  }

  navigateToEmailLogin() {
    this.router.navigate(['/auth/email-login']);
  }

  loginAsGuest() {
    this.guestError.set('');
    this.guestLoginAttempted.set(true);
    this.authStore.loginAsGuest();
  }
}
