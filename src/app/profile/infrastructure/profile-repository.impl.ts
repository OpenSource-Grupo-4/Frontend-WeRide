import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProfileRepository, CreateProfileData } from '../domain/profile.repository';
import { Profile } from '../domain/model/profile.entity';

interface ProfileResponse {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileRepositoryImpl extends ProfileRepository {
  private readonly baseUrl = `${environment.apiUrl}${environment.endpoints.profiles}`;

  constructor(private http: HttpClient) {
    super();
  }

  createProfile(data: CreateProfileData): Observable<Profile> {
    return this.http.post<ProfileResponse>(this.baseUrl, {
      // ponytail: userId es ignorado por el backend (lo saca del JWT vía
      // CreateProfileCommandFromResourceAssembler) pero el DTO lo exige
      // @NotNull — cualquier valor no-nulo sirve.
      userId: 0,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email
    }).pipe(
      map(response => this.toDomain(response)),
      catchError((err: HttpErrorResponse) => throwError(() => new Error(this.mapError(err))))
    );
  }

  getProfile(profileId: number): Observable<Profile> {
    return this.http.get<ProfileResponse>(`${this.baseUrl}/${profileId}`).pipe(
      map(response => this.toDomain(response)),
      catchError((err: HttpErrorResponse) => throwError(() => new Error(this.mapError(err))))
    );
  }

  private toDomain(response: ProfileResponse): Profile {
    return new Profile(response.id, response.userId, response.firstName, response.lastName, response.email);
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 401) return 'Sesión inválida, iniciá sesión de nuevo';
    if (err.status === 404) return 'Perfil no encontrado';
    if (err.status === 409) return typeof err.error === 'string' && err.error ? err.error : 'El perfil ya existe';
    if (typeof err.error === 'string' && err.error) return err.error;
    return 'Error de conexión con el servidor';
  }
}
