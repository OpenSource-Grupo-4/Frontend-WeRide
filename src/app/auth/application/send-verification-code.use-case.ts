import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class SendVerificationCodeUseCase {
  constructor(private authRepository: AuthRepository) {}

  execute(phone: string): Observable<boolean> {
    return this.authRepository.sendVerificationCode(phone);
  }
}
