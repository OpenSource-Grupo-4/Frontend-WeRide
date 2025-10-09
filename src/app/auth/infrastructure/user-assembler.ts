import { User, UserPreferences, UserStatistics } from '../domain/model/user.entity';
import { UserResponse } from './users-response';

export class UserAssembler {
  static toEntity(response: UserResponse): User {
    return new User(
      response.id,
      response.name,
      response.email,
      response.phone,
      response.membershipPlanId,
      response.isActive,
      response.profilePicture,
      response.dateOfBirth,
      response.address,
      response.emergencyContact,
      response.verificationStatus,
      response.registrationDate,
      response.preferences,
      response.statistics,
      response.drivingLicense
    );
  }

  static toEntityArray(responses: UserResponse[]): User[] {
    return responses.map(response => this.toEntity(response));
  }
}

