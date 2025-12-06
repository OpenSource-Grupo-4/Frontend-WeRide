import { Component, signal, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BookingNotificationService } from './booking/application/booking-notification.service';
import { AuthStore } from './auth/application/auth.store';
import { AuthSession } from './auth/domain/model/auth-session.entity';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Frontend-WeRide');
  private translate = inject(TranslateService);
  private bookingNotificationService = inject(BookingNotificationService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  constructor() {

  }

  ngOnInit() {
    const defaultLang = 'es';
    const browserLang = navigator.language.split('-')[0];
    const lang = ['en', 'es'].includes(browserLang) ? browserLang : defaultLang;

    this.translate.setDefaultLang(defaultLang);

    this.translate.use(lang).subscribe(() => {
    });

    // Initialize auth session from localStorage
    this.initializeAuth();
  }

  private initializeAuth(): void {
    if (typeof window === 'undefined') return;

    const storedSession = localStorage.getItem('auth_session');
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        const expiresAt = new Date(sessionData.expiresAt);
        
        // Check if session is still valid
        if (expiresAt > new Date()) {
          // Create proper AuthSession instance
          const session = new AuthSession(
            sessionData.user,
            sessionData.token,
            expiresAt,
            sessionData.isGuest || false
          );
          
          // Restore session
          this.authStore.setSession(session);
        } else {
          // Session expired, clear it
          localStorage.removeItem('auth_session');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('auth_session');
      }
    }
  }

  ngOnDestroy() {
    this.bookingNotificationService.stopMonitoring();
  }
}
