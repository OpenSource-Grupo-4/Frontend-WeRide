import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class LogoutUseCase {
  constructor(private authRepository: AuthRepository) {}

  execute(): Observable<void> {
    return this.authRepository.logout();
  }
}
