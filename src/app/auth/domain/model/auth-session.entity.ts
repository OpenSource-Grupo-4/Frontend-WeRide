import { User } from './user.entity';

export function isJwtToken(token: unknown): token is string {
  return typeof token === 'string'
    && token.split('.').length === 3
    && token.split('.').every(segment => segment.length > 0);
}

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
    return !this.isGuest && this.isValid && isJwtToken(this.token);
  }
}

export default AuthSession;
