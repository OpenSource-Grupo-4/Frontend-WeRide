import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom, of } from 'rxjs';

import { GarageLayout } from './garage-layout';
import { GetVehiclesUseCase } from '../../../application/use-cases/get-vehicles.usecase';
import { FilterVehiclesUseCase } from '../../../application/use-cases/filter-vehicles.usecase';
import { ToggleFavoriteUseCase } from '../../../application/use-cases/toggle-favorite.usecase';
import { FavoriteStore } from '../../../application/favorite.store';
import { AuthStore } from '../../../../auth/application/auth.store';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { Vehicle } from '../../../domain/model/vehicle.model';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({
      garage: { resultsCount: 'vehicles found', noResults: 'No vehicles found' }
    } as any);
  }
}

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: '1',
    brand: 'Xiaomi',
    model: 'M365',
    year: 2023,
    battery: 82,
    maxSpeed: 25,
    range: 30,
    weight: 12.5,
    color: 'black',
    licensePlate: 'XM001',
    location: '1',
    status: 'available',
    type: 'electric_scooter',
    companyId: '1',
    pricePerMinute: 0.5,
    image: 'assets/vehicles/xiaomi-m365.jpg',
    features: ['GPS'],
    maintenanceStatus: 'good',
    lastMaintenance: '2024-09-15T10:00:00Z',
    nextMaintenance: '2024-11-15T10:00:00Z',
    totalKilometers: 1250.5,
    rating: 4.6
  },
  {
    id: '2',
    brand: 'Segway',
    model: 'Ninebot',
    year: 2023,
    battery: 90,
    maxSpeed: 25,
    range: 40,
    weight: 13,
    color: 'white',
    licensePlate: 'SG002',
    location: '2',
    status: 'available',
    type: 'electric_scooter',
    companyId: '1',
    pricePerMinute: 0.6,
    image: 'assets/vehicles/segway-max.jpg',
    features: ['GPS', 'Bluetooth'],
    maintenanceStatus: 'good',
    lastMaintenance: '2024-08-01T10:00:00Z',
    nextMaintenance: '2024-10-01T10:00:00Z',
    totalKilometers: 900,
    rating: 4.8
  }
];

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

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('en');
    await firstValueFrom(translate.use('en'));

    fixture = TestBed.createComponent(GarageLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a results count with the number of filtered vehicles', async () => {
    const getVehiclesUseCase = TestBed.inject(GetVehiclesUseCase) as jasmine.SpyObj<GetVehiclesUseCase>;
    const filterVehiclesUseCase = TestBed.inject(FilterVehiclesUseCase) as jasmine.SpyObj<FilterVehiclesUseCase>;
    getVehiclesUseCase.execute.and.resolveTo(MOCK_VEHICLES);
    filterVehiclesUseCase.execute.and.resolveTo(MOCK_VEHICLES);

    await component.loadVehicles();
    fixture.detectChanges();

    const countEl = fixture.nativeElement.querySelector('.results-count');
    expect(countEl).not.toBeNull();
    expect(countEl.textContent.replace(/\s+/g, ' ').trim()).toBe('2 vehicles found');
    expect(fixture.nativeElement.querySelectorAll('app-vehicle-card').length).toBe(2);
  });

  it('updates the results count after applying a filter', async () => {
    const filterVehiclesUseCase = TestBed.inject(FilterVehiclesUseCase) as jasmine.SpyObj<FilterVehiclesUseCase>;
    filterVehiclesUseCase.execute.and.resolveTo([MOCK_VEHICLES[0]]);

    await component.applyFilter({} as any);
    fixture.detectChanges();

    const countEl = fixture.nativeElement.querySelector('.results-count');
    expect(countEl.textContent.replace(/\s+/g, ' ').trim()).toBe('1 vehicles found');
  });

  it('shows the no-results state instead of a count when a filter yields zero vehicles', async () => {
    const filterVehiclesUseCase = TestBed.inject(FilterVehiclesUseCase) as jasmine.SpyObj<FilterVehiclesUseCase>;
    filterVehiclesUseCase.execute.and.resolveTo([]);

    await component.applyFilter({} as any);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.no-results')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('app-vehicle-card').length).toBe(0);
  });
});
