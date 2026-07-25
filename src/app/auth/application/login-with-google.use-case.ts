import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';
import { AuthSession } from '../domain/model/auth-session.entity';

@Injectable({
  providedIn: 'root'
})
export class LoginWithGoogleUseCase {
  constructor(private authRepository: AuthRepository) {}

  execute(account: { email: string }): Observable<AuthSession> {
    return this.authRepository.loginWithGoogle(account);
  }
}
