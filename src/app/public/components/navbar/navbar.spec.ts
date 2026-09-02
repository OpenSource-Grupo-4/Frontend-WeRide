import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { signal } from '@angular/core';
import { Navbar } from './navbar';
import { AuthStore } from '../../../auth/application/auth.store';
import { NotificationsApiEndpoint } from '../../../booking/infraestructure/notifications-api-endpoint';

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authStore: { currentUser: ReturnType<typeof signal>; session: ReturnType<typeof signal>; logout: jasmine.Spy };

  beforeEach(async () => {
    const currentUser = signal({ id: 'u1', name: 'Juan Pérez' } as any);
    const notificationsApi = jasmine.createSpyObj<NotificationsApiEndpoint>('NotificationsApiEndpoint', ['getAll']);
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
});
