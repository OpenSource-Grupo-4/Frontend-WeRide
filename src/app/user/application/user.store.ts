import {BehaviorSubject, Observable, of} from 'rxjs';
import {User} from '../domain/model/user.entity';
import {UserApiEndpoint} from '../infrastructure/user-api-endpoint';
import {catchError, tap} from 'rxjs/operators';


export class UserStore {
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  private selectedUserSubject = new BehaviorSubject<User | null>(null);
  public selectedUser$ = this.selectedUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private userApiEndpoint: UserApiEndpoint) {}

  loadUsers(): void
  {
    this.loadingSubject.next(true);
    this.userApiEndpoint.getAll().pipe(
      tap(users => {
        this.usersSubject.next(users);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al cargar usuarios:', error);
        this.loadingSubject.next(false);
        this.usersSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }

  loadUsersById(id: number): void
  {
    this.loadingSubject.next(true);
    this.userApiEndpoint.getById(id).pipe(
      tap(user => {
        this.selectedUserSubject.next(user);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al cargar usuario por ID:', error);
        this.loadingSubject.next(false);
        this.selectedUserSubject.next(null);
        return of(null);
      })
    ).subscribe();
  }

  selectUser(user: User): void
  {
    this.selectedUserSubject.next(user);
  }

  createUser(user: User): Observable<User>
  {
    return this.userApiEndpoint.create(user)
    .pipe(
      tap(newUser => {
        const currentUsers = this.usersSubject.getValue();
        this.usersSubject.next([...currentUsers, newUser]);
      })
    );
  }

  updateUser(id: number, user: User): Observable<User>
  {
    return this.userApiEndpoint.update(id, user)
    .pipe(
      tap(updatedUser => {
        const currentUsers = this.usersSubject.value;
        const index = currentUsers.findIndex(u => u.id === id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.usersSubject.next([...currentUsers]);
        }
      })
    );
  }

  deleteUser(id: number): Observable<void>
  {
    return this.userApiEndpoint.delete(id)
    .pipe(
      tap(() => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next(currentUsers.filter(u => u.id !== id));
      })
    );
  }
}
