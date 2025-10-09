import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';
import { AuthCredentials } from '../domain/model/auth-credentials.entity';
import { AuthSession } from '../domain/model/auth-session.entity';

@Injectable({
  providedIn: 'root'
})
export class LoginWithEmailUseCase {
  constructor(private authRepository: AuthRepository) {}

  execute(credentials: AuthCredentials): Observable<AuthSession> {
    return this.authRepository.loginWithEmail(credentials);
  }
}
