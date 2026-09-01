import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthStore } from '../../../auth/application/auth.store';
import { NotificationsApiEndpoint } from '../../../booking/infraestructure/notifications-api-endpoint';
import { HeaderComponent } from './header';

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
