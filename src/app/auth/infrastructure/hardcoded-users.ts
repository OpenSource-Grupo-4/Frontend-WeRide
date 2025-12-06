import { User } from '../domain/model/user.entity';

export interface HardcodedUserData {
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

const hardcodedUsersData: HardcodedUserData[] = [
  {
    id: 'user-001',
    name: 'Juan Pérez',
    email: 'juan@weride.com',
    password: '1234',
    phone: '+34600123456',
    membershipPlanId: 'premium-plan-001',
    isActive: true,
    profilePicture: 'assets/users/juan.jpg',
    dateOfBirth: '1990-05-15',
    address: 'Calle Mayor 123, Madrid',
    emergencyContact: '+34600987654',
    verificationStatus: 'verified',
    registrationDate: '2024-01-15T10:00:00Z',
    preferences: {
      language: 'es',
      notifications: true,
      theme: 'light'
    },
    statistics: {
      totalTrips: 45,
      totalDistance: 1250,
      totalSpent: 350.50,
      averageRating: 4.8
    },
    drivingLicense: 'B12345678'
  },
  {
    id: 'user-002',
    name: 'María García',
    email: 'maria@weride.com',
    password: '1234',
    phone: '+34600111111',
    membershipPlanId: 'basic-plan-001',
    isActive: true,
    profilePicture: 'assets/users/maria.jpg',
    dateOfBirth: '1992-08-22',
    address: 'Avenida Libertad 45, Barcelona',
    emergencyContact: '+34600222222',
    verificationStatus: 'verified',
    registrationDate: '2024-02-20T14:30:00Z',
    preferences: {
      language: 'es',
      notifications: true,
      theme: 'dark'
    },
    statistics: {
      totalTrips: 28,
      totalDistance: 890,
      totalSpent: 245.75,
      averageRating: 4.6
    },
    drivingLicense: 'B87654321'
  },
  {
    id: 'user-003',
    name: 'Carlos López',
    email: 'carlos@weride.com',
    password: '1234',
    phone: '+34600333333',
    membershipPlanId: 'business-plan-001',
    isActive: true,
    profilePicture: 'assets/users/carlos.jpg',
    dateOfBirth: '1988-11-10',
    address: 'Plaza España 7, Valencia',
    emergencyContact: '+34600444444',
    verificationStatus: 'verified',
    registrationDate: '2024-03-10T09:15:00Z',
    preferences: {
      language: 'es',
      notifications: false,
      theme: 'light'
    },
    statistics: {
      totalTrips: 67,
      totalDistance: 2100,
      totalSpent: 580.25,
      averageRating: 4.9
    },
    drivingLicense: 'B11223344'
  },
  {
    id: 'user-004',
    name: 'Usuario Demo',
    email: 'usuario@gmail.com',
    password: '1234',
    phone: '+34600555555',
    membershipPlanId: 'basic-plan-001',
    isActive: true,
    profilePicture: 'assets/users/default.jpg',
    dateOfBirth: '1995-03-20',
    address: 'Calle Ejemplo 10, Madrid',
    emergencyContact: '+34600666666',
    verificationStatus: 'verified',
    registrationDate: '2024-04-01T12:00:00Z',
    preferences: {
      language: 'es',
      notifications: true,
      theme: 'light'
    },
    statistics: {
      totalTrips: 15,
      totalDistance: 450,
      totalSpent: 120.00,
      averageRating: 4.5
    }
  },
  {
    id: 'user-005',
    name: 'María García',
    email: 'maria.garcia@gmail.com',
    password: '1234',
    phone: '+34600777777',
    membershipPlanId: 'premium-plan-001',
    isActive: true,
    profilePicture: 'assets/users/maria.jpg',
    dateOfBirth: '1992-08-22',
    address: 'Avenida Libertad 45, Barcelona',
    emergencyContact: '+34600888888',
    verificationStatus: 'verified',
    registrationDate: '2024-04-05T10:00:00Z',
    preferences: {
      language: 'es',
      notifications: true,
      theme: 'dark'
    },
    statistics: {
      totalTrips: 32,
      totalDistance: 950,
      totalSpent: 280.50,
      averageRating: 4.7
    },
    drivingLicense: 'B99887766'
  },
  {
    id: 'user-006',
    name: 'Juan Pérez',
    email: 'juan.perez@gmail.com',
    password: '1234',
    phone: '+34600999999',
    membershipPlanId: 'business-plan-001',
    isActive: true,
    profilePicture: 'assets/users/juan.jpg',
    dateOfBirth: '1990-05-15',
    address: 'Calle Mayor 123, Madrid',
    emergencyContact: '+34600101010',
    verificationStatus: 'verified',
    registrationDate: '2024-04-10T08:00:00Z',
    preferences: {
      language: 'es',
      notifications: true,
      theme: 'light'
    },
    statistics: {
      totalTrips: 52,
      totalDistance: 1800,
      totalSpent: 520.75,
      averageRating: 4.9
    },
    drivingLicense: 'B55443322'
  }
];

export function getHardcodedUsers(): HardcodedUserData[] {
  return [...hardcodedUsersData];
}

export function getUserByEmail(email: string): HardcodedUserData | undefined {
  return hardcodedUsersData.find(user => user.email === email);
}

export function getUserByPhone(phone: string): HardcodedUserData | undefined {
  return hardcodedUsersData.find(user => user.phone === phone);
}

export function getUserById(id: string): HardcodedUserData | undefined {
  return hardcodedUsersData.find(user => user.id === id);
}

export function toUserEntity(userData: HardcodedUserData): User {
  return new User(
    userData.id,
    userData.name,
    userData.email,
    userData.phone,
    userData.membershipPlanId,
    userData.isActive,
    userData.profilePicture,
    userData.dateOfBirth,
    userData.address,
    userData.emergencyContact,
    userData.verificationStatus,
    userData.registrationDate,
    userData.preferences,
    userData.statistics,
    userData.drivingLicense
  );
}

export function addUser(userData: HardcodedUserData): void {
  hardcodedUsersData.push(userData);
}

