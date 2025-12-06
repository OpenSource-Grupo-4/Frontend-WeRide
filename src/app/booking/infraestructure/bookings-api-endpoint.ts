import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BookingResponse, PaginatedResponse } from './bookings-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  constructor(private http: HttpClient) {
    const fullUrl = `${window.location.origin}${this.baseUrl}`;
    console.log('BookingsApiEndpoint - baseUrl:', this.baseUrl);
    console.log('BookingsApiEndpoint - Full URL:', fullUrl);
    console.log('BookingsApiEndpoint - Proxy should redirect to: http://localhost:8080' + this.baseUrl);
  }

  // Obtener todas las reservas
  getAll(): Observable<BookingResponse[]> {
    const fullUrl = `${window.location.origin}${this.baseUrl}`;
    console.log('Fetching bookings from:', this.baseUrl);
    console.log('Full request URL:', fullUrl);
    console.log('Expected proxy target: http://localhost:8080' + this.baseUrl);
    return this.http.get<PaginatedResponse<BookingResponse>>(this.baseUrl, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      map(response => {
        console.log('Bookings API Response:', response);
        // Si la respuesta es un array directo (no paginado), devolverlo
        if (Array.isArray(response)) {
          return response;
        }
        // Si es una respuesta paginada, extraer content
        if (response && response.content) {
          return response.content;
        }
        // Si no tiene content, puede ser un array vacío o estructura diferente
        return [];
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Crear una nueva reserva
  create(booking: Omit<BookingResponse, 'id'>): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.baseUrl, booking, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Obtener una reserva por ID
  getById(id: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/${id}`, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Actualizar una reserva
  update(id: string, booking: Partial<BookingResponse>): Observable<BookingResponse> {
    return this.http.patch<BookingResponse>(`${this.baseUrl}/${id}`, booking, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Eliminar una reserva
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Obtener reservas por userId
  getByUserId(userId: string): Observable<BookingResponse[]> {
    return this.http.get<PaginatedResponse<BookingResponse>>(`${this.baseUrl}?userId=${userId}`, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response?.content || [];
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Obtener reservas por vehicleId
  getByVehicleId(vehicleId: string): Observable<BookingResponse[]> {
    return this.http.get<PaginatedResponse<BookingResponse>>(`${this.baseUrl}?vehicleId=${vehicleId}`, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response?.content || [];
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Verificar salud del backend
  checkBackendHealth(): Observable<boolean> {
    // Intentar hacer una petición simple al endpoint base
    return this.http.get<any>(this.baseUrl, {
      headers: {
        'Accept': 'application/json'
      },
      observe: 'response'
    }).pipe(
      map(response => {
        const isHealthy = response.status >= 200 && response.status < 300;
        if (isHealthy) {
          console.log('Backend health check: OK - Backend is accessible');
        }
        return isHealthy;
      }),
      catchError(error => {
        console.warn('Backend health check: FAILED', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        console.warn('El backend no está disponible. Verifica que esté corriendo en http://localhost:8080');
        return of(false);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Unknown error occurred';
    let troubleshootingTips = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
      troubleshootingTips = 'Verifica tu conexión a internet y que el servidor de desarrollo esté corriendo.';
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

      // Mensajes específicos según el código de error
      if (error.status === 404) {
        troubleshootingTips = 'El endpoint no fue encontrado. Verifica:\n' +
          '1. Que el backend esté corriendo en http://localhost:8080\n' +
          '2. Que el proxy esté configurado correctamente en proxy.conf.json\n' +
          '3. Que la ruta del endpoint sea correcta: /api/v1/bookings\n' +
          '4. Reinicia el servidor de desarrollo de Angular (ng serve)';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar al servidor';
        troubleshootingTips = 'El backend no está disponible. Verifica:\n' +
          '1. Que el backend esté corriendo en http://localhost:8080\n' +
          '2. Que puedas acceder a Swagger en http://localhost:8080/swagger-ui.html\n' +
          '3. Que no haya problemas de firewall bloqueando la conexión';
      } else if (error.status === 500) {
        troubleshootingTips = 'Error interno del servidor. Revisa los logs del backend.';
      }

      // Si el error es que recibimos HTML en lugar de JSON
      if (error.status === 200 && error.error && typeof error.error === 'string' && error.error.includes('<!doctype')) {
        errorMessage = 'Server returned HTML instead of JSON. Check proxy configuration and ensure backend is running on http://localhost:8080';
        troubleshootingTips = 'El proxy puede no estar funcionando correctamente. Verifica la configuración en proxy.conf.json';
      }
    }

    console.error('BookingsApiEndpoint Error:', {
      url: error.url,
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      message: errorMessage,
      troubleshooting: troubleshootingTips
    });

    if (troubleshootingTips) {
      console.warn('Troubleshooting Tips:', troubleshootingTips);
    }

    return throwError(() => new Error(errorMessage));
  }
}
