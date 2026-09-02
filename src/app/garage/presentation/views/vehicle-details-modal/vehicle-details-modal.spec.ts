import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { VehicleDetailsModal } from './vehicle-details-modal';
import { Vehicle } from '../../../domain/model/vehicle.model';

class FakeLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('VehicleDetailsModal', () => {
  let component: VehicleDetailsModal;
  let fixture: ComponentFixture<VehicleDetailsModal>;

  const mockVehicle: Vehicle = {
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
    features: ['GPS', 'Bluetooth', 'Mobile App', 'LED Lights'],
    maintenanceStatus: 'good',
    lastMaintenance: '2024-09-15T10:00:00Z',
    nextMaintenance: '2024-11-15T10:00:00Z',
    totalKilometers: 1250.5,
    rating: 4.6
  };

  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<VehicleDetailsModal>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<VehicleDetailsModal>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        VehicleDetailsModal,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } })
      ],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: mockVehicle },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleDetailsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display vehicle information', () => {
    expect(component.vehicle).toEqual(mockVehicle);
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
