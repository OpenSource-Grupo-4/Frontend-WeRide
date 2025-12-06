export interface UserPreferences {
  language: string;
  notifications: boolean;
  theme: string;
}

export interface UserStatistics {
  totalTrips: number;
  totalDistance: number;
  totalSpent: number;
  averageRating: number;
}

export class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public phone: string,
    public membershipPlanId: string,
    public isActive: boolean,
    public profilePicture: string,
    public dateOfBirth: string,
    public address: string,
    public emergencyContact: string,
    public verificationStatus: string,
    public registrationDate: string,
    public preferences: UserPreferences,
    public statistics: UserStatistics,
    public drivingLicense?: string
  ) {}

  get fullName(): string {
    return this.name;
  }

  get isVerified(): boolean {
    return this.verificationStatus === 'verified';
  }

  get isPremium(): boolean {
    return this.membershipPlanId.includes('premium') || this.membershipPlanId.includes('business');
  }
}
