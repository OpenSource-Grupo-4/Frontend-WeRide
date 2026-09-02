import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { CurrentUserViewService } from '../../../../profile/application/current-user-view.service';
import { User } from '../../../domain/model/user.entity';
import { UserStats } from './user-stats';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('UserStats', () => {
  let component: UserStats;
  let fixture: ComponentFixture<UserStats>;
  let currentUserView: jasmine.SpyObj<CurrentUserViewService>;

  beforeEach(async () => {
    currentUserView = jasmine.createSpyObj<CurrentUserViewService>('CurrentUserViewService', [
      'getCurrentUser$'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        UserStats,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [{ provide: CurrentUserViewService, useValue: currentUserView }]
    }).compileComponents();
  });

  // Creates the component AFTER the per-test stub is configured: the component
  // captures `user$` at construction, so the observable must already be stubbed.
  function render(user: User | null): void {
    currentUserView.getCurrentUser$.and.returnValue(of(user));
    fixture = TestBed.createComponent(UserStats);
    component = fixture.componentInstance;
    fixture.detectChanges(); // subscribe (async pipe first pass)
    fixture.detectChanges(); // render the synchronously-emitted value
  }

  it('should create', () => {
    render(null);
    expect(component).toBeTruthy();
  });

  it('renders zeroed stats when the user has no statistics object', () => {
    render({ name: 'Ana', profilePicture: '', statistics: undefined } as any);

    const values = fixture.nativeElement.querySelectorAll('.stat-value');
    expect(values.length).toBe(4);
    expect(values[0].textContent.trim()).toBe('0');
  });

  it('renders the real statistics when present', () => {
    render({
      name: 'Ana',
      statistics: { totalTrips: 45, totalDistance: 1250, totalSpent: 350.5, averageRating: 4.8 }
    } as any);

    const values = fixture.nativeElement.querySelectorAll('.stat-value');
    expect(values.length).toBe(4);
    expect(values[0].textContent.trim()).toContain('45');
  });
});
