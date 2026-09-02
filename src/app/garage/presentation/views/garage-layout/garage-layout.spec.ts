import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { GarageLayout } from './garage-layout';
import { GetVehiclesUseCase } from '../../../application/use-cases/get-vehicles.usecase';
import { FilterVehiclesUseCase } from '../../../application/use-cases/filter-vehicles.usecase';
import { ToggleFavoriteUseCase } from '../../../application/use-cases/toggle-favorite.usecase';
import { FavoriteStore } from '../../../application/favorite.store';
import { AuthStore } from '../../../../auth/application/auth.store';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('GarageLayout', () => {
  let component: GarageLayout;
  let fixture: ComponentFixture<GarageLayout>;

  beforeEach(async () => {
    const dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    const snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    const activeBookingService = jasmine.createSpyObj<ActiveBookingService>('ActiveBookingService', [
      'getActiveBooking'
    ]);
    activeBookingService.getActiveBooking.and.returnValue(null);
    const getVehiclesUseCase = jasmine.createSpyObj<GetVehiclesUseCase>('GetVehiclesUseCase', ['execute']);
    getVehiclesUseCase.execute.and.resolveTo([]);
    const filterVehiclesUseCase = jasmine.createSpyObj<FilterVehiclesUseCase>('FilterVehiclesUseCase', ['execute']);
    filterVehiclesUseCase.execute.and.resolveTo([]);
    const toggleFavoriteUseCase = jasmine.createSpyObj<ToggleFavoriteUseCase>('ToggleFavoriteUseCase', ['execute']);
    // FavoriteStore is an ngrx signalStore instance; only the signal getters
    // used by the component are stubbed (as function-typed getters).
    const favoriteStore = {
      favoriteVehicleIds: jasmine.createSpy('favoriteVehicleIds').and.returnValue([]),
      loadUserFavorites: jasmine.createSpy('loadUserFavorites'),
      error: jasmine.createSpy('error').and.returnValue(null)
    };
    // AuthStore is a signalStore: session()/currentUser() are signal getters.
    const authStore = {
      session: () => ({ isAuthenticated: false }),
      currentUser: () => null
    };

    await TestBed.configureTestingModule({
      imports: [
        GarageLayout,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ActiveBookingService, useValue: activeBookingService },
        { provide: GetVehiclesUseCase, useValue: getVehiclesUseCase },
        { provide: FilterVehiclesUseCase, useValue: filterVehiclesUseCase },
        { provide: ToggleFavoriteUseCase, useValue: toggleFavoriteUseCase },
        { provide: FavoriteStore, useValue: favoriteStore },
        { provide: AuthStore, useValue: authStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GarageLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
