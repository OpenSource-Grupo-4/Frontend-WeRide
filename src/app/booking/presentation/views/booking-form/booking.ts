import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    TranslateModule
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

  // Fallos de carga de catálogos: se muestran en la UI con opción de reintentar
  // en lugar de dejar selects vacíos sin explicación.
  vehiclesLoadFailed = false;
  locationsLoadFailed = false;

  selectedVehicle: string = '';
  startLocationId = '';
  endLocationId = '';
  selectedDate: string = '';
  unlockTime: string = '';
  duration: number = 1;
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
    this.vehiclesLoadFailed = false;
    this.vehiclesApi.getAll().subscribe({
      next: (data) => {
        this.vehicles = data;
        // Reset simétrico: una respuesta exitosa (aunque sea de una llamada más
        // antigua que llegue tarde) debe limpiar un fallo previo; si no, un error
        // de un reintento anterior dejaría la bandera pegada tras un éxito.
        this.vehiclesLoadFailed = false;
      },
      error: (err) => {
        console.error('Error cargando vehículos', err);
        this.vehiclesLoadFailed = true;
        this.showErrorMessage('booking.form.loadVehiclesError');
      }
    });
  }

  private loadLocations(): void {
    this.locationsLoadFailed = false;
    this.locationsApi.getAll().subscribe({
      next: locations => {
        // Solo ubicaciones activas; NUNCA auto-seleccionar una por defecto: si la
        // carga falla (o no hay ubicaciones) los selects quedan vacíos y el usuario
        // ve un mensaje de error con reintento en lugar de una reserva equivocada.
        this.locations = locations.filter(location => location.isActive);
        this.locationsLoadFailed = false;
      },
      error: () => {
        this.locationsLoadFailed = true;
        this.showErrorMessage('booking.form.loadLocationsError');
      }
    });
  }

  /** Vuelve a intentar la carga de catálogos tras un fallo (botón "Reintentar"). */
  retryLoad(): void {
    this.loadVehicles();
    this.loadLocations();
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
    const parsedDuration = Number(booking.duration);
    this.duration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 1;
  }

  // --- LÓGICA DE FORMULARIO Y API ---

  submitBooking() {
    if (this.isEditMode && this.editingBookingId) {
      this.updateBooking();
    } else {
      this.createNewBooking();
    }
  }

  private createNewBooking(): void {
    const startDateTime = this.combineDateTime(this.selectedDate, this.unlockTime);
    const calculatedCost = this.calculateCost();

    // Las ubicaciones se eligen de la lista real (LocationsApiEndpoint) y ya no
    // se auto-seleccionan: si no hay ubicaciones o falla su carga, el usuario no
    // puede enviar (canSubmit false) hasta completar los campos.
    // El userId hardcodeado ('1') es inofensivo contra el backend real (lo ignora
    // y usa el JWT), pero sigue siendo fijo contra el mock actual.
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
    // Un borrador existe para persistir trabajo PARCIAL: basta con haber elegido
    // vehículo (DraftBookingService tolera ubicaciones/fecha/hora vacías y usa
    // valores por defecto). El envío real sí exige el formulario completo.
    if (!this.canSaveDraft) {
      this.showErrorMessage('booking.form.missingFields');
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

  /** Tarifa por minuto del vehículo seleccionado (derivada, siempre al día). */
  get rate(): number {
    if (this.selectedVehicle) {
      const vehicle = this.vehicles.find(v => v.id === this.selectedVehicle);
      if (vehicle) {
        return vehicle.pricePerMinute || vehicle.rate || 0;
      }
    }
    return 0;
  }

  // --- GETTERS DE ESTADO DEL FORMULARIO ---

  /** El formulario es válido sólo cuando hay vehículo, ambas ubicaciones, fecha,
   *  hora y una duración positiva. Controla "Reservar Ahora" y la vista previa
   *  de precio previa al envío. */
  get canSubmit(): boolean {
    return !!(this.selectedVehicle && this.startLocationId && this.endLocationId &&
      this.selectedDate && this.unlockTime && this.duration > 0);
  }

  /** Un borrador sólo necesita un vehículo elegido: el resto del formulario puede
   *  estar incompleto (DraftBookingService rellena fecha/hora y tolera ubicaciones
   *  vacías). Controla "Guardar como Borrador". */
  get canSaveDraft(): boolean {
    return !!this.selectedVehicle;
  }

  /** Vista previa de precio ANTES de confirmar. Excluye el estado posterior al
   *  envío (showSummary) para que nunca se muestren dos resúmenes apilados. */
  get showPricePreview(): boolean {
    return this.canSubmit && !this.showSummary;
  }

  /** Coste total estimado = tarifa por minuto × duración (en minutos). */
  calculateCost(): number {
    return this.rate * this.duration;
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

  private formatDateForInput(date: Date): string {
    // Componentes LOCALES (no UTC): toISOString() desplazaría la fecha al día
    // siguiente para zonas horarias negativas (p. ej. UTC-5 en la noche) y el
    // input de fecha mostraría un día distinto al de la hora local elegida.
    // formatTimeForInput ya usa getHours()/getMinutes() locales, así que ambos
    // quedan consistentes (y combineDateTime parsea "YYYY-MM-DDTHH:mm" como local).
    const d = new Date(date);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
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
