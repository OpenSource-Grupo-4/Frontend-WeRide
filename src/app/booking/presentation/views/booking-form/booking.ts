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
import { LocationsApiEndpoint } from '../../../infraestructure/locations-api-endpoint';
import { LocationResponse } from '../../../infraestructure/locations-response';
import { DraftBookingService } from '../../../application/draft-booking.service';

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
  private locationsApi = inject(LocationsApiEndpoint);
  private draftService = inject(DraftBookingService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  isEditMode = false;
  editingBookingId: string | null = null;

  // Array dinámico que se llena desde la API de Garage
  vehicles: any[] = [];
  locations: LocationResponse[] = [];

  selectedVehicle: string = '';
  startLocationId = '';
  endLocationId = '';
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
    this.loadLocations();

    // 3. Verificar si es modo edición
    this.route.paramMap.subscribe(params => {
      const bookingId = params.get('id');
      if (bookingId) {
        this.isEditMode = true;
        this.editingBookingId = bookingId;
        this.loadBookingForEdit(bookingId);
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

  private loadLocations(): void {
    this.locationsApi.getAll().subscribe({
      next: locations => {
        this.locations = locations.filter(location => location.isActive);
        this.startLocationId ||= this.locations[0]?.id || '';
        this.endLocationId ||= this.locations[1]?.id || this.locations[0]?.id || '';
      },
      error: () => this.showErrorMessage('Error cargando la lista de ubicaciones')
    });
  }

  private loadBookingForEdit(bookingId: string): void {
    const booking = this.bookingStorage.getBookingById(bookingId);

    if (booking) {
      this.applyBooking(booking);
    } else {
      this.bookingsApi.getById(bookingId).subscribe({
        next: bookingResponse => this.applyBooking(bookingResponse),
        error: () => this.showErrorMessage('booking.notFound')
      });
    }
  }

  private applyBooking(booking: any): void {
    this.selectedVehicle = String(booking.vehicleId);
    this.startLocationId = booking.startLocationId ? String(booking.startLocationId) : this.startLocationId;
    this.endLocationId = booking.endLocationId ? String(booking.endLocationId) : this.endLocationId;
    this.selectedDate = this.formatDateForInput(new Date(booking.startDate));
    this.unlockTime = this.formatTimeForInput(new Date(booking.startDate));
    this.duration = booking.duration || 1;
    this.updateRate();
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

    // PENDIENTE backend/UX: startLocationId/endLocationId están
    // hardcodeados ('loc-A'/'loc-B') porque este formulario no tiene un
    // selector de ubicaciones reales. El backend real espera Long, así
    // que crear una reserva contra el backend real fallará (400) hasta
    // que se construya un selector — eso es un cambio de UX, fuera de
    // alcance de esta fase. El userId hardcodeado ('1') es inofensivo
    // contra el backend real (lo ignora y usa el JWT), pero sigue siendo
    // fijo contra el mock actual.
    // PAYLOAD COMPLETO (NECESARIO PARA PASAR LA VALIDACIÓN TS DEL FRONTEND)
    const payload: any = {
      vehicleId: Number(this.selectedVehicle),
      startLocationId: Number(this.startLocationId),
      endLocationId: Number(this.endLocationId),
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
    if (!this.selectedVehicle || !this.startLocationId || !this.endLocationId) {
      this.showErrorMessage('Completa vehículo y ubicaciones antes de guardar');
      return;
    }
    this.draftService.saveDraft({
      vehicleId: this.selectedVehicle,
      selectedDate: this.selectedDate,
      unlockTime: this.unlockTime,
      durationMinutes: this.duration,
      startLocationId: this.startLocationId,
      endLocationId: this.endLocationId,
      smsReminder: this.smsReminder,
      emailConfirmation: this.emailConfirmation,
      pushNotification: this.pushNotification
    }).subscribe({
      next: () => { this.showSummary = true; this.showSuccessMessage('booking.draftSaved'); },
      error: () => this.showErrorMessage('booking.draftSaveError')
    });
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
