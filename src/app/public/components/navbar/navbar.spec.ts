import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Navbar } from './navbar';
import { AuthStore } from '../../../auth/application/auth.store';
import { NotificationsApiEndpoint } from '../../../booking/infraestructure/notifications-api-endpoint';

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

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
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
        Navbar,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationsApiEndpoint, useValue: notificationsApi }
      ]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('en');
    translate.use('en').subscribe();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('derives initials from the session user name', () => {
    expect(component.getUserInitials()).toBe('JP');
  });

  it('shows the real user name in the navbar button', () => {
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

    component.loadNotifications();

    expect(notificationsApi.getAll).not.toHaveBeenCalled();
  });

  it('does not call the notifications API for a guest session (guest id, not authenticated)', () => {
    authStore.currentUser.set({ id: 'guest', name: 'Invitado' } as any);
    authStore.session.set({ isAuthenticated: false });
    notificationsApi.getAll.calls.reset();

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

  it('shows the textual empty state when there are no notifications and the menu is open', () => {
    component.notifications.set([]);
    component.isNotificationMenuOpen.set(true);
    fixture.detectChanges();

    const emptyTexts = fixture.nativeElement.querySelectorAll('.empty-text, .empty-subtext');
    expect(emptyTexts.length).toBeGreaterThan(0);
    const textContent = (Array.from(emptyTexts) as Element[])
      .map((el) => el.textContent?.trim() ?? '')
      .join(' ');
    expect(textContent).toContain('You have no notifications yet');
    expect(textContent).toContain("We'll let you know when something happens with your bookings");
  });
});
