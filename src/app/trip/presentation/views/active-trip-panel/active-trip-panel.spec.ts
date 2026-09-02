import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { ActiveTripPanel } from './active-trip-panel';
import { TripStore } from '../../../application/trip.store';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('ActiveTripPanel', () => {
  let component: ActiveTripPanel;
  let fixture: ComponentFixture<ActiveTripPanel>;

  beforeEach(async () => {
    // TripStore is read through its signal getters only; stub the surface the
    // template/computed reads as plain spy functions (per trip-details pattern).
    // NOTE: the panel template dereferences currentVehicle()/currentLocation()/
    // destinationLocation() unconditionally, so the getters must return real
    // (non-null) objects for the render pass to succeed.
    const tripStore = {} as jasmine.SpyObj<TripStore>;
    tripStore.currentVehicle = jasmine.createSpy('currentVehicle').and.returnValue({
      id: 'v-1',
      brand: 'Xiaomi',
      model: 'M365',
      licensePlate: 'ABC-123',
      image: 'assets/vehicles/scooter.png'
    }) as any;
    tripStore.currentLocation = jasmine.createSpy('currentLocation').and.returnValue({
      id: 'loc-1',
      name: 'Lima'
    }) as any;
    tripStore.destinationLocation = jasmine.createSpy('destinationLocation').and.returnValue({
      id: 'loc-2',
      name: 'Miraflores'
    }) as any;

    await TestBed.configureTestingModule({
      imports: [
        ActiveTripPanel,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        { provide: TripStore, useValue: tripStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveTripPanel);
    component = fixture.componentInstance;
    // Required inputs.
    fixture.componentRef.setInput('elapsedTime', '00:00:00');
    fixture.componentRef.setInput('remainingTime', '00:00:00');
    fixture.componentRef.setInput('currentBattery', 80);
    fixture.componentRef.setInput('estimatedDistance', 1.5);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
