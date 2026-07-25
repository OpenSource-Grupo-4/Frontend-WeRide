import { Observable } from 'rxjs';
import { Profile } from './model/profile.entity';

export interface CreateProfileData {
  firstName: string;
  lastName: string;
  email: string;
}

export abstract class ProfileRepository {
  abstract createProfile(data: CreateProfileData): Observable<Profile>;
  abstract getProfile(profileId: number): Observable<Profile>;
}
