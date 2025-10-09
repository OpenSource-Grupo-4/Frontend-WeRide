import { User } from './user.entity';

export class AuthSession {
  constructor(
    public user: User,
    public token: string,
    public expiresAt: Date,
    public isGuest: boolean = false
  ) {}

  get isValid(): boolean {
    return new Date() < this.expiresAt;
  }

  get isAuthenticated(): boolean {
    return !this.isGuest && this.isValid;
  }
}

export default AuthSession;
