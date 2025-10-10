import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse } from './users-response';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersApiEndpoint {
  private readonly baseUrl = `${environment.apiUrl}${environment.endpoints.users}`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.baseUrl);
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
  }

  getUserByEmail(email: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}?email=${email}`);
  }

  getUserByPhone(phone: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}?phone=${phone}`);
  }

  createUser(user: Partial<UserResponse>): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, user);
  }

  updateUser(id: string, user: Partial<UserResponse>): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/${id}`, user);
  }
}

