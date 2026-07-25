import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthStore } from '../../auth/application/auth.store';
import { User as AuthUser } from '../../auth/domain/model/user.entity';
import { ProfileStore } from './profile.store';
import { Profile } from '../domain/model/profile.entity';
import { User } from '../../user/domain/model/user.entity';

export function toCurrentUserView(authUser: AuthUser | null, profile: Profile | null): User | null {
  if (!authUser) return null;

  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : authUser.name;
  const email = profile?.email ?? authUser.email;

  return new User(
    Number(authUser.id) || 0,
    name,
    email,
    0,
    authUser.phone,
    authUser.membershipPlanId,
    authUser.isActive,
    authUser.profilePicture,
    authUser.dateOfBirth,
    authUser.address,
    authUser.emergencyContact,
    authUser.verificationStatus,
    new Date(authUser.registrationDate),
    authUser.preferences,
    authUser.statistics
  );
}

@Injectable({ providedIn: 'root' })
export class CurrentUserViewService {
  private readonly authStore = inject(AuthStore);
  private readonly profileStore = inject(ProfileStore);

  getCurrentUser$(): Observable<User | null> {
    return combineLatest([
      toObservable(this.authStore.currentUser),
      toObservable(this.profileStore.profile)
    ]).pipe(
      map(([authUser, profile]) => toCurrentUserView(authUser, profile))
    );
  }
}
