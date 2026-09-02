import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { AuthStore } from '../../../auth/application/auth.store';
import { NotificationsApiEndpoint } from '../../../booking/infraestructure/notifications-api-endpoint';
import { HeaderComponent } from './header';

const notificationsTranslations = {
  navbar: {
    notifications: {
      empty: 'You have no notifications yet',
      emptySubtext: "We'll let you know when something happens with your bookings"
    }
  }
};

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of(notificationsTranslations);
  }
}

describe('HeaderComponent notification authentication', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let notificationsApi: jasmine.SpyObj<NotificationsApiEndpoint>;

  beforeEach(() => {
    notificationsApi = jasmine.createSpyObj<NotificationsApiEndpoint>('NotificationsApiEndpoint', ['getAll']);
    notificationsApi.getAll.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [HeaderComponent, TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        {
          provide: AuthStore,
          useValue: {
            session: () => ({ isValid: true, isGuest: true, isAuthenticated: false }),
            currentUser: () => ({ id: 'guest' })
          }
        },
        { provide: NotificationsApiEndpoint, useValue: notificationsApi }
      ]
    });

    fixture = TestBed.createComponent(HeaderComponent);
  });

  it('no consulta notificaciones protegidas para una sesión invitada', () => {
    fixture.detectChanges();

    expect(notificationsApi.getAll).not.toHaveBeenCalled();
  });
});

describe('HeaderComponent user identity', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authStore: { currentUser: ReturnType<typeof signal>; session: ReturnType<typeof signal>; logout: jasmine.Spy };
  let notificationsApi: jasmine.SpyObj<NotificationsApiEndpoint>;

  beforeEach(async () => {
    const currentUser = signal({ id: 'u1', name: 'Juan Pérez' } as any);
    notificationsApi = jasmine.createSpyObj<NotificationsApiEndpoint>('NotificationsApiEndpoint', ['getAll']);
    notificationsApi.getAll.and.returnValue(of([]));
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authStore = {
      currentUser,
      session: signal({ isAuthenticated: true }),
      logout: jasmine.createSpy('logout')
    };

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: routerSpy },
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationsApiEndpoint, useValue: notificationsApi }
      ]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('en');
    translate.use('en').subscribe();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('derives initials from the session user name', () => {
    expect(component.getUserInitials()).toBe('JP');
  });

  it('shows the real user name in the header', () => {
    const nameEl = fixture.nativeElement.querySelector('.user-name-nav');
    expect(nameEl.textContent.trim()).toBe('Juan Pérez');
  });

  it('delegates logout to authStore.logout and navigates to login', () => {
    component.logout();
    expect(authStore.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('does not call the notifications API when there is no current user', () => {
    authStore.currentUser.set(null);
    notificationsApi.getAll.calls.reset();
    fixture.detectChanges();

    component.loadNotifications();

    expect(notificationsApi.getAll).not.toHaveBeenCalled();
  });

  it('keeps existing notifications and logs when the API call fails', () => {
    notificationsApi.getAll.and.returnValue(throwError(() => new Error('HTTP 500')));
    component.notifications.set([{ id: 'n1' } as any]);
    spyOn(console, 'error');

    component.loadNotifications();

    expect(console.error).toHaveBeenCalledWith('Error loading notifications:', jasmine.any(Error));
    expect(component.notifications()).toEqual([{ id: 'n1' } as any]);
  });

  it('shows the textual empty state when there are no notifications', async () => {
    component.notifications.set([]);

    const notificationButton = fixture.nativeElement.querySelector('.notification-btn');
    notificationButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const emptyState = document.querySelector('.notification-empty');
    expect(emptyState).not.toBeNull();
    const text = emptyState ? (emptyState.textContent || '') : '';
    expect(text).toContain('You have no notifications yet');
    expect(text).toContain("We'll let you know when something happens with your bookings");
  });
});
