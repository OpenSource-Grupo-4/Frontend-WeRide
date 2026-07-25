import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileRepository } from '../domain/profile.repository';
import { Profile } from '../domain/model/profile.entity';

@Injectable({ providedIn: 'root' })
export class GetProfileUseCase {
  constructor(private profileRepository: ProfileRepository) {}

  execute(profileId: number): Observable<Profile> {
    return this.profileRepository.getProfile(profileId);
  }
}
