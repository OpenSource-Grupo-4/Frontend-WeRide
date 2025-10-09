export interface UserResponse {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  membershipPlanId: string;
  isActive: boolean;
  profilePicture: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  verificationStatus: string;
  registrationDate: string;
  preferences: {
    language: string;
    notifications: boolean;
    theme: string;
  };
  statistics: {
    totalTrips: number;
    totalDistance: number;
    totalSpent: number;
    averageRating: number;
  };
  drivingLicense?: string;
}

export interface UsersApiResponse {
  users: UserResponse[];
}

