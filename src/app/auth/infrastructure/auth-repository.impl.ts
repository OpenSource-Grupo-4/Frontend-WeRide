import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthRepository } from '../domain/auth.repository';
import { User } from '../domain/model/user.entity';
import { AuthCredentials } from '../domain/model/auth-credentials.entity';
import { PhoneCredentials } from '../domain/model/phone-credentials.entity';
import { AuthSession } from '../domain/model/auth-session.entity';
import { RegistrationData } from '../domain/model/registration-data.entity';
import { getUserByEmail, getUserByPhone, toUserEntity, addUser, HardcodedUserData } from './hardcoded-users';
import { AUTH_SESSION_KEY, decodeJwtExpiry } from './token-storage';

interface SignInResponse {
  id: number;
  token: string;
}

interface SignUpResponse {
  id: number;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthRepositoryImpl extends AuthRepository {
  private verificationCodes: Map<string, string> = new Map();

  constructor(private http: HttpClient) {
    super();
  }

  loginWithEmail(credentials: AuthCredentials): Observable<AuthSession> {
    const authUrl = `${environment.apiUrl}${environment.endpoints.authentication}/sign-in`;

    return this.http.post<SignInResponse>(authUrl, {
      username: credentials.username,
      password: credentials.password
    }).pipe(
      map(({ id, token }) => {
        const user = this.toMinimalUser(id, credentials.username);
        const session = new AuthSession(user, token, decodeJwtExpiry(token), false);
        this.saveSession(session);
        return session;
      }),
      catchError((err: HttpErrorResponse) => throwError(() => new Error(this.mapAuthError(err))))
    );
  }

  loginWithPhone(credentials: PhoneCredentials): Observable<AuthSession> {
    const storedCode = this.verificationCodes.get(credentials.phone);

    if (!storedCode || storedCode !== credentials.verificationCode) {
      return throwError(() => new Error('Código de verificación inválido'));
    }

    const userData = getUserByPhone(credentials.phone);

    if (!userData) {
      return throwError(() => new Error('Usuario no encontrado'));
    }

    if (!userData.isActive) {
      return throwError(() => new Error('Usuario inactivo'));
    }

    const userEntity = toUserEntity(userData);
    const session = this.createSession(userEntity, false);
    this.saveSession(session);
    this.verificationCodes.delete(credentials.phone);
    return of(session);
  }

  loginWithGoogle(account: { email: string }): Observable<AuthSession> {
    const userData = getUserByEmail(account.email);

    if (!userData) {
      return throwError(() => new Error('Usuario no encontrado'));
    }

    if (!userData.isActive) {
      return throwError(() => new Error('Usuario inactivo'));
    }

    const userEntity = toUserEntity(userData);
    const session = this.createSession(userEntity, false);
    this.saveSession(session);
    return of(session);
  }

  loginAsGuest(): Observable<AuthSession> {
    const guestUser = new User(
      'guest',
      'Invitado',
      'guest@weride.com',
      '',
      'free-plan',
      true,
      'assets/users/guest.jpg',
      '',
      '',
      '',
      'guest',
      new Date().toISOString(),
      {
        language: 'es',
        notifications: false,
        theme: 'light'
      },
      {
        totalTrips: 0,
        totalDistance: 0,
        totalSpent: 0,
        averageRating: 0
      }
    );

    const session = this.createSession(guestUser, true);
    this.saveSession(session);
    return of(session);
  }

  register(data: RegistrationData): Observable<User> {
    if (!data.password) {
      return this.registerMock(data);
    }

    const username = data.email!;
    const authUrl = `${environment.apiUrl}${environment.endpoints.authentication}/sign-up`;

    return this.http.post<SignUpResponse>(authUrl, {
      username,
      password: data.password
    }).pipe(
      map(({ id, username: createdUsername }) => this.toMinimalUser(id, createdUsername)),
      catchError((err: HttpErrorResponse) => throwError(() => new Error(this.mapAuthError(err))))
    );
  }

  private registerMock(data: RegistrationData): Observable<User> {
    const newUserData: HardcodedUserData = {
      id: `user-${Date.now()}`,
      name: data.fullName,
      email: data.email || `${data.phone}@weride.com`,
      password: Math.random().toString(36).slice(-8),
      phone: data.phone,
      membershipPlanId: 'basic-plan-001',
      isActive: true,
      profilePicture: 'assets/users/default.jpg',
      dateOfBirth: '',
      address: '',
      emergencyContact: '',
      verificationStatus: 'pending',
      registrationDate: new Date().toISOString(),
      preferences: {
        language: 'es',
        notifications: true,
        theme: 'light'
      },
      statistics: {
        totalTrips: 0,
        totalDistance: 0,
        totalSpent: 0,
        averageRating: 0
      }
    };

    addUser(newUserData);
    const userEntity = toUserEntity(newUserData);
    return of(userEntity);
  }

  sendVerificationCode(phone: string): Observable<boolean> {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    this.verificationCodes.set(phone, code);
    console.log(`Código de verificación para ${phone}: ${code}`);
    return of(true);
  }

  verifyCode(phone: string, code: string): Observable<boolean> {
    const storedCode = this.verificationCodes.get(phone);
    return of(storedCode === code);
  }

  logout(): Observable<void> {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return of(void 0);
  }

  getCurrentUser(): Observable<User | null> {
    const session = this.getStoredSession();
    return of(session?.user || null);
  }

  refreshSession(): Observable<AuthSession> {
    const session = this.getStoredSession();
    if (!session) {
      return throwError(() => new Error('No hay sesión activa'));
    }
    return of(session);
  }

  private mapAuthError(err: HttpErrorResponse): string {
    if (err.status === 401) return 'Usuario o contraseña incorrectos';
    if (err.status === 409) return typeof err.error === 'string' && err.error ? err.error : 'La cuenta ya existe';
    if (typeof err.error === 'string' && err.error) return err.error;
    return 'Error de conexión con el servidor';
  }

  private toMinimalUser(id: number, username: string): User {
    // ponytail: perfil mínimo hasta que la Fase 3 (Profiles) traiga los
    // datos reales desde GET /api/v1/profiles/{id}.
    return new User(
      String(id),
      username,
      username,
      '',
      '',
      true,
      'assets/users/default.jpg',
      '',
      '',
      '',
      'pending',
      new Date().toISOString(),
      {
        language: 'es',
        notifications: true,
        theme: 'light'
      },
      {
        totalTrips: 0,
        totalDistance: 0,
        totalSpent: 0,
        averageRating: 0
      }
    );
  }

  private createSession(user: User, isGuest: boolean): AuthSession {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const token = this.generateToken();
    return new AuthSession(user, token, expiresAt, isGuest);
  }

  private generateToken(): string {
    return 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  private saveSession(session: AuthSession): void {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
      user: session.user,
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      isGuest: session.isGuest
    }));
  }

  private getStoredSession(): AuthSession | null {
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    if (!stored) return null;

    try {
      const data = JSON.parse(stored);
      return new AuthSession(
        data.user,
        data.token,
        new Date(data.expiresAt),
        data.isGuest
      );
    } catch {
      return null;
    }
  }
}
