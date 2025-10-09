import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthRepository } from '../domain/auth.repository';
import { User } from '../domain/model/user.entity';
import { AuthCredentials } from '../domain/model/auth-credentials.entity';
import { PhoneCredentials } from '../domain/model/phone-credentials.entity';
import { AuthSession } from '../domain/model/auth-session.entity';
import { RegistrationData } from '../domain/model/registration-data.entity';
import { UsersApiEndpoint } from './users-api-endpoint';
import { UserAssembler } from './user-assembler';

@Injectable({
  providedIn: 'root'
})
export class AuthRepositoryImpl extends AuthRepository {
  private readonly AUTH_SESSION_KEY = 'auth_session';
  private verificationCodes: Map<string, string> = new Map();

  constructor(private usersApi: UsersApiEndpoint) {
    super();
  }

  loginWithEmail(credentials: AuthCredentials): Observable<AuthSession> {
    return this.usersApi.getUserByEmail(credentials.email).pipe(
      map(users => {
        if (users.length === 0) {
          throw new Error('Usuario no encontrado');
        }

        const user = users[0];
        if (user.password !== credentials.password) {
          throw new Error('Contraseña incorrecta');
        }

        if (!user.isActive) {
          throw new Error('Usuario inactivo');
        }

        const userEntity = UserAssembler.toEntity(user);
        const session = this.createSession(userEntity, false);
        this.saveSession(session);
        return session;
      })
    );
  }

  loginWithPhone(credentials: PhoneCredentials): Observable<AuthSession> {
    const storedCode = this.verificationCodes.get(credentials.phone);

    if (!storedCode || storedCode !== credentials.verificationCode) {
      return throwError(() => new Error('Código de verificación inválido'));
    }

    return this.usersApi.getUserByPhone(credentials.phone).pipe(
      map(users => {
        if (users.length === 0) {
          throw new Error('Usuario no encontrado');
        }

        const user = users[0];
        if (!user.isActive) {
          throw new Error('Usuario inactivo');
        }

        const userEntity = UserAssembler.toEntity(user);
        const session = this.createSession(userEntity, false);
        this.saveSession(session);
        this.verificationCodes.delete(credentials.phone);
        return session;
      })
    );
  }

  loginWithGoogle(): Observable<AuthSession> {
    return throwError(() => new Error('Google login no implementado'));
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
    const newUser = {
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

    return this.usersApi.createUser(newUser).pipe(
      map(response => UserAssembler.toEntity(response))
    );
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
    localStorage.removeItem(this.AUTH_SESSION_KEY);
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
    localStorage.setItem(this.AUTH_SESSION_KEY, JSON.stringify({
      user: session.user,
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      isGuest: session.isGuest
    }));
  }

  private getStoredSession(): AuthSession | null {
    const stored = localStorage.getItem(this.AUTH_SESSION_KEY);
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
