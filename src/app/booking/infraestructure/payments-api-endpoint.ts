import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Payment {
  id: string;
  userId: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: string;
  cardLast4?: string;
  status: string;
  transactionId: string;
  processedAt: string;
  description: string;
  invoice?: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
}

export interface CreatePaymentPayload {
  planId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  cardLast4?: string;
  billingAddress?: string;
  saveCard?: boolean;
}

export interface PaymentResponse {
  id: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class PaymentsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.payments}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.baseUrl);
  }

  getByUserId(userId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}?userId=${userId}`);
  }

  getById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreatePaymentPayload): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.baseUrl, payload);
  }
}
