import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';
import { PhoneCredentials } from '../domain/model/phone-credentials.entity';
import { AuthSession } from '../domain/model/auth-session.entity';

@Injectable({
  providedIn: 'root'
})
export class LoginWithPhoneUseCase {
  constructor(private authRepository: AuthRepository) {}

  execute(credentials: PhoneCredentials): Observable<AuthSession> {
    return this.authRepository.loginWithPhone(credentials);
  }
}
