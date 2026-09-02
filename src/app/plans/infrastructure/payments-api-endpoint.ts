import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  create(payload: CreatePaymentPayload): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.baseUrl, payload);
  }
}
