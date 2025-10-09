import { Observable } from 'rxjs';
import { User } from './model/user.entity';
import { AuthCredentials } from './model/auth-credentials.entity';
import { PhoneCredentials } from './model/phone-credentials.entity';
import { AuthSession } from './model/auth-session.entity';
import { RegistrationData } from './model/registration-data.entity';

export abstract class AuthRepository {
  abstract loginWithEmail(credentials: AuthCredentials): Observable<AuthSession>;
  abstract loginWithPhone(credentials: PhoneCredentials): Observable<AuthSession>;
  abstract loginWithGoogle(): Observable<AuthSession>;
  abstract loginAsGuest(): Observable<AuthSession>;
  abstract register(data: RegistrationData): Observable<User>;
  abstract sendVerificationCode(phone: string): Observable<boolean>;
  abstract verifyCode(phone: string, code: string): Observable<boolean>;
  abstract logout(): Observable<void>;
  abstract getCurrentUser(): Observable<User | null>;
  abstract refreshSession(): Observable<AuthSession>;
}
