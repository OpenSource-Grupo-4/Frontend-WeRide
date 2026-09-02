import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { signal } from '@angular/core';
import { AuthStore } from '../../../auth/application/auth.store';
import { NotificationsApiEndpoint } from '../../../booking/infraestructure/notifications-api-endpoint';
import { HeaderComponent } from './header';

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
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

  beforeEach(async () => {
    const currentUser = signal({ id: 'u1', name: 'Juan Pérez' } as any);
    const notificationsApi = jasmine.createSpyObj<NotificationsApiEndpoint>('NotificationsApiEndpoint', ['getAll']);
    notificationsApi.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        {
          provide: AuthStore,
          useValue: {
            currentUser,
            session: signal({ isAuthenticated: true }),
            logout: jasmine.createSpy('logout')
          }
        },
        { provide: NotificationsApiEndpoint, useValue: notificationsApi }
      ]
    }).compileComponents();

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
});
