import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { EMPTY, Observable, of } from 'rxjs';

import { Favorites } from './favorites';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { GetVehiclesUseCase } from '../../../application/use-cases/get-vehicles.usecase';
import { ToggleFavoriteUseCase } from '../../../application/use-cases/toggle-favorite.usecase';
import { FavoriteStore } from '../../../application/favorite.store';
import { AuthStore } from '../../../../auth/application/auth.store';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

function createVehicle(): Vehicle {
  return {
    id: 'v-1',
    brand: 'Xiaomi',
    model: 'M365',
    year: 2023,
    battery: 80,
    maxSpeed: 25,
    range: 30,
    weight: 12,
    color: 'black',
    licensePlate: 'ABC-123',
    location: 'loc-1',
    status: 'available',
    type: 'electric_scooter',
    companyId: 'c-1',
    pricePerMinute: 0.5,
    image: 'assets/vehicles/scooter.png',
    features: ['LED', 'GPS'],
    maintenanceStatus: 'ok',
    lastMaintenance: '2025-01-01',
    nextMaintenance: '2026-01-01',
    totalKilometers: 100,
    rating: 4.5,
    favorite: false
  };
}

describe('Favorites', () => {
  let component: Favorites;
  let fixture: ComponentFixture<Favorites>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let activeBookingService: jasmine.SpyObj<ActiveBookingService>;
  let getVehiclesUseCase: jasmine.SpyObj<GetVehiclesUseCase>;
  // FavoriteStore is an ngrx signalStore instance; only its signal getters are
  // used by the component, so stub that surface.
  let favoriteStore: {
    isLoading: jasmine.Spy;
    error: jasmine.Spy;
    favoriteVehicleIds: jasmine.Spy;
    loadUserFavorites: jasmine.Spy;
  };
  let toggleFavoriteUseCase: jasmine.SpyObj<ToggleFavoriteUseCase>;
  // AuthStore is a signalStore: session()/currentUser() are signal getters.
  // Stub mutable: por defecto sesión NO autenticada (hydrateFavorites() no hace
  // nada); el test de hidratación re-configura session/currentUser ANTES de
  // crear el componente.
  let authStore: {
    session: () => { isAuthenticated: boolean };
    currentUser: () => { id: string } | null;
  };

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    activeBookingService = jasmine.createSpyObj<ActiveBookingService>('ActiveBookingService', [
      'getActiveBooking'
    ]);
    getVehiclesUseCase = jasmine.createSpyObj<GetVehiclesUseCase>('GetVehiclesUseCase', ['execute']);
    favoriteStore = {
      isLoading: jasmine.createSpy('isLoading'),
      error: jasmine.createSpy('error'),
      favoriteVehicleIds: jasmine.createSpy('favoriteVehicleIds'),
      loadUserFavorites: jasmine.createSpy('loadUserFavorites')
    };
    toggleFavoriteUseCase = jasmine.createSpyObj<ToggleFavoriteUseCase>('ToggleFavoriteUseCase', ['execute']);
    authStore = {
      session: () => ({ isAuthenticated: false }),
      currentUser: () => null
    };

    // Defaults: no active booking, empty favorite list, modal never resolves.
    activeBookingService.getActiveBooking.and.returnValue(null);
    dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
    getVehiclesUseCase.execute.and.resolveTo([]);
    favoriteStore.isLoading.and.returnValue(false);
    favoriteStore.error.and.returnValue(null);
    favoriteStore.favoriteVehicleIds.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [
        Favorites,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ActiveBookingService, useValue: activeBookingService },
        { provide: GetVehiclesUseCase, useValue: getVehiclesUseCase },
        { provide: ToggleFavoriteUseCase, useValue: toggleFavoriteUseCase },
        { provide: FavoriteStore, useValue: favoriteStore },
        { provide: AuthStore, useValue: authStore }
      ]
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(Favorites);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to schedule-unlock with immediate true when the modal resolves book_now', () => {
    const vehicle = createVehicle();
    dialog.open.and.returnValue({ afterClosed: () => of({ action: 'book_now' }) } as any);

    component.navigateToScheduleUnlock(vehicle);

    expect(dialog.open).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/schedule-unlock'], {
      state: { vehicle, immediate: true }
    });
  });

  it('navigates to schedule-unlock with immediate false when the modal resolves schedule', () => {
    const vehicle = createVehicle();
    dialog.open.and.returnValue({ afterClosed: () => of({ action: 'schedule' }) } as any);

    component.navigateToScheduleUnlock(vehicle);

    expect(dialog.open).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/schedule-unlock'], {
      state: { vehicle, immediate: false }
    });
  });

  it('does not open the modal or navigate when there is an active booking (shows snackbar instead)', () => {
    const vehicle = createVehicle();
    activeBookingService.getActiveBooking.and.returnValue({ id: 'b-1' } as any);
    snackBar.open.and.returnValue({ onAction: () => EMPTY } as any);

    component.navigateToScheduleUnlock(vehicle);

    expect(snackBar.open).toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('hydrates server favorites on init when authenticated', async () => {
    // Configura una sesión autenticada ANTES de crear el componente, ya que el
    // beforeEach construyó el fixture con la sesión por defecto (no autenticada).
    authStore.session = () => ({ isAuthenticated: true });
    authStore.currentUser = () => ({ id: 'user-1' });

    fixture = TestBed.createComponent(Favorites);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();

    expect(favoriteStore.loadUserFavorites).toHaveBeenCalledWith('user-1');
  });
});
