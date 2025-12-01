import { Component, signal, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BookingNotificationService } from './booking/application/booking-notification.service';
import { AuthStore } from './auth/application/auth.store';

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

  constructor() {
    // Monitor authentication state and start/stop notification service accordingly
    effect(() => {
      const currentUser = this.authStore.currentUser();
      
      if (currentUser) {
        // User is authenticated, start monitoring
        this.bookingNotificationService.startMonitoring();
      } else {
        // User is not authenticated, stop monitoring
        this.bookingNotificationService.stopMonitoring();
      }
    });
  }

  ngOnInit() {
    const defaultLang = 'es';
    const browserLang = navigator.language.split('-')[0];
    const lang = ['en', 'es'].includes(browserLang) ? browserLang : defaultLang;
    
    this.translate.setDefaultLang(defaultLang);
    
    this.translate.use(lang).subscribe(() => {
    });
  }

  ngOnDestroy() {
    // Cleanup: stop monitoring when app is destroyed
    this.bookingNotificationService.stopMonitoring();
  }
}
