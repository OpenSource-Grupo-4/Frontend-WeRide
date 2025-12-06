import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { BookingStorageService } from '../../../application/booking-storage.service';
import { BookingStore } from '../../../application/booking.store';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infraestructure/vehicles-api-endpoint';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    TranslateModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  templateUrl: './booking.html',
  styleUrls: ['./booking.css']
})
export class BookingFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingStorage = inject(BookingStorageService);
  private bookingStore = inject(BookingStore);
  private bookingsApi = inject(BookingsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  isEditMode = false;
  editingBookingId: string | null = null;

  // Array dinámico que se llena desde la API de Garage
  vehicles: any[] = [];

  selectedVehicle: string = '';
  selectedDate: string = '';
  unlockTime: string = '';
  duration: number = 1;
  rate: number = 0;
  showSummary: boolean = false;
  smsReminder: boolean = false;
  emailConfirmation: boolean = false;
  pushNotification: boolean = false;

  ngOnInit(): void {
    // 1. Inicializar valores de fecha/hora por defecto
    const now = new Date();
    this.selectedDate = this.formatDateForInput(now);
    this.unlockTime = this.formatTimeForInput(now);

    // 2. Cargar lista de vehículos
    this.loadVehicles();

    // 3. Verificar si es modo edición
    this.route.paramMap.subscribe(params => {
      const bookingId = params.get('id');
      if (bookingId) {
        this.isEditMode = true;
        this.editingBookingId = bookingId;
        setTimeout(() => this.loadBookingForEdit(bookingId), 500);
      }
    });
  }

  // --- MÉTODOS DE CARGA ---

  private loadVehicles(): void {
    this.vehiclesApi.getAll().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.updateRate();
      },
      error: (err) => {
        console.error('Error cargando vehículos', err);
        this.showErrorMessage('Error cargando la lista de vehículos');
      }
    });
  }

  private loadBookingForEdit(bookingId: string): void {
    const booking = this.bookingStorage.getBookingById(bookingId);

    if (booking) {
      this.selectedVehicle = booking.vehicleId;
      this.selectedDate = this.formatDateForInput(booking.startDate);
      this.unlockTime = this.formatTimeForInput(booking.startDate);
      this.duration = booking.duration || 1;
      this.updateRate();
    } else {
      this.bookingsApi.getAll().subscribe(bookings => {
        const found = bookings.find((b: any) => b.id === bookingId);
        if(found) {
          this.selectedVehicle = found.vehicleId;
          this.duration = found.duration || 1;
          this.updateRate();
        }
      });
    }
  }

  // --- LÓGICA DE FORMULARIO Y API ---

  submitBooking() {
    this.updateRate();

    if (this.isEditMode && this.editingBookingId) {
      this.updateBooking();
    } else {
      this.createNewBooking();
    }
  }

  private createNewBooking(): void {
    const startDateTime = this.combineDateTime(this.selectedDate, this.unlockTime);
    const calculatedCost = this.calculateCost();

    // PAYLOAD COMPLETO (NECESARIO PARA PASAR LA VALIDACIÓN TS DEL FRONTEND)
    const payload: any = {
      userId: '1',
      vehicleId: this.selectedVehicle,
      startLocationId: 'loc-A',
      endLocationId: 'loc-B',
      reservedAt: new Date().toISOString(),
      startDate: startDateTime.toISOString(),
      endDate: new Date(startDateTime.getTime() + (this.duration * 60000)).toISOString(),
      status: 'pending',
      totalCost: calculatedCost,
      discount: 0,
      finalCost: calculatedCost,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      distance: 0,
      duration: this.duration,
      averageSpeed: 0,
      actualStartDate: null,
      actualEndDate: null,
      rating: null
    };

    this.bookingsApi.create(payload).subscribe({
      next: (response) => {

        const newBookingEntity = this.mapApiResponseToBookingEntity(response);
        this.bookingStorage.saveBooking(newBookingEntity);
        this.bookingStore.addBooking(newBookingEntity);

        this.showSuccessMessage('booking.createSuccess');
        this.showSummary = true;

        setTimeout(async () =>{ // <--- HACEMOS EL CALLBACK ASÍNCRONO
          await this.router.navigate(['/booking/list']); // <--- USAMOS AWAIT
        }, 2000);
      },
      error: (err) => {
        console.error('Error creando reserva:', err);
        this.showErrorMessage('booking.createError');
      }
    });
  }

  private updateBooking(): void {
    if (!this.editingBookingId) return;

    const startDateTime = this.combineDateTime(this.selectedDate, this.unlockTime);
    const calculatedCost = this.calculateCost();

    const payload: any = {
      vehicleId: this.selectedVehicle,
      duration: this.duration,
      startDate: startDateTime.toISOString(),
      totalCost: calculatedCost,
      finalCost: calculatedCost
    };

    this.bookingsApi.update(this.editingBookingId, payload).subscribe({
      next: (response) => {
        const updatedEntity = this.mapApiResponseToBookingEntity(response);
        this.bookingStorage.updateBooking(this.editingBookingId!, updatedEntity);
        this.bookingStore.loadFromLocalStorage();

        this.showSuccessMessage('booking.updateSuccess');
        this.showSummary = true;
        setTimeout(() => this.router.navigate(['/booking/list']), 2000);
      },
      error: (err) => {
        console.error('Error actualizando:', err);
        this.showErrorMessage('booking.updateError');
      }
    });
  }

  saveDraft() {
    this.showSummary = true;
    this.showSuccessMessage('Borrador guardado localmente (simulado)');
  }

  // --- MÉTODOS AUXILIARES Y GETTERS ---

  getVehicleName(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? `${v.brand} ${v.model}` : '';
  }

  getVehicleType(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? (v.type || 'Unknown') : '';
  }

  getVehicleBattery(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? (v.battery + '%' || 'N/A') : '';
  }

  getVehicleRange(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? (v.range + ' km' || 'N/A') : '';
  }

  updateRate(): void {
    if (this.selectedVehicle && this.vehicles.length > 0) {
      const vehicle = this.vehicles.find(v => v.id === this.selectedVehicle);
      this.rate = vehicle ? (vehicle.pricePerMinute || vehicle.rate || 0) : 0;
    }
  }

  // --- UTILIDADES ---

  // La función de mapeo (conversión de string a Date) AHORA ESTÁ DENTRO DE LA CLASE
  private mapApiResponseToBookingEntity(response: any): any {
    // Corrige el error TS2345
    return {
      ...response,
      reservedAt: response.reservedAt ? new Date(response.reservedAt) : null,
      startDate: response.startDate ? new Date(response.startDate) : null,
      endDate: response.endDate ? new Date(response.endDate) : null,
      actualStartDate: response.actualStartDate ? new Date(response.actualStartDate) : null,
      actualEndDate: response.actualEndDate ? new Date(response.actualEndDate) : null,
    };
  }

  private combineDateTime(dateStr: string, timeStr: string): Date {
    // Arregla la construcción de la fecha
    return new Date(`${dateStr}T${timeStr}`);
  }

  private calculateCost(): number {
    return this.rate * this.duration;
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private formatTimeForInput(date: Date): string {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // --- Mensajes ---

  private showSuccessMessage(key: string): void {
    const message = this.translate.instant(key);
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(key: string): void {
    const message = this.translate.instant(key);
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
