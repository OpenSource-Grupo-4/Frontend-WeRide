import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';
import { AuthSession } from '../domain/model/auth-session.entity';

@Injectable({
  providedIn: 'root'
})
export class LoginAsGuestUseCase {
  constructor(private authRepository: AuthRepository) {}

  execute(): Observable<AuthSession> {
    return this.authRepository.loginAsGuest();
  }
}
