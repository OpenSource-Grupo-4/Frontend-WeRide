import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';
import { RegistrationData } from '../domain/model/registration-data.entity';
import { User } from '../domain/model/user.entity';

@Injectable({
  providedIn: 'root'
})
export class RegisterUserUseCase {
  constructor(private authRepository: AuthRepository) {}

  execute(data: RegistrationData): Observable<User> {
    return this.authRepository.register(data);
  }
}
