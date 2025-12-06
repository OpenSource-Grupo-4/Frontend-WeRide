export class RegistrationData {
  constructor(
    public firstName: string,
    public lastName: string,
    public phone: string,
    public email?: string
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
