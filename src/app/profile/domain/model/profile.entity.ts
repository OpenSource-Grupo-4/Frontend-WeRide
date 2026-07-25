export class Profile {
  constructor(
    public id: number,
    public userId: number,
    public firstName: string,
    public lastName: string,
    public email: string
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
