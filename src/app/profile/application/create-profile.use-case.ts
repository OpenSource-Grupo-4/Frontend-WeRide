import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileRepository, CreateProfileData } from '../domain/profile.repository';
import { Profile } from '../domain/model/profile.entity';

@Injectable({ providedIn: 'root' })
export class CreateProfileUseCase {
  constructor(private profileRepository: ProfileRepository) {}

  execute(data: CreateProfileData): Observable<Profile> {
    return this.profileRepository.createProfile(data);
  }
}
