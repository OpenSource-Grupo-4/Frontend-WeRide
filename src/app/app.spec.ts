import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { App } from './app';
import { AuthStore } from './auth/application/auth.store';
import { BookingNotificationService } from './booking/application/booking-notification.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        // App only starts/stops monitoring; stub the whole service so its own
        // DI graph (snack bar, dialog, endpoints, auth store) is not needed.
        {
          provide: BookingNotificationService,
          useValue: {
            startMonitoring: jasmine.createSpy('startMonitoring'),
            stopMonitoring: jasmine.createSpy('stopMonitoring')
          }
        },
        // AuthStore is an ngrx signalStore; App only calls setSession when a
        // stored session exists (none in tests), plus reads via getters.
        {
          provide: AuthStore,
          useValue: {
            session: () => null,
            currentUser: () => null,
            setSession: jasmine.createSpy('setSession')
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    // The app shell only renders <router-outlet>; the title lives in the
    // component's title signal (there is no static <h1> anymore).
    expect((app as any).title()).toBe('Frontend-WeRide');
  });
});
