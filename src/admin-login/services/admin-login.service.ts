import { Injectable } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { _dbadmin } from '../models/user.entity';
import { Repository } from 'typeorm';
import { User } from '../models/user.interface';
import { Observable, catchError, from, map, of, switchMap, throwError } from 'rxjs';
import { AuthService } from 'src/auth/service/auth.service';
import { v4 as uuidv4} from 'uuid';
import { HttpModule } from '@nestjs/axios';
import { environment } from 'src/environments/environment.prod';
import { Module } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Module({
  imports: [
    TypeOrmModule.forFeature([_dbadmin]),
    HttpModule,
  ],
  providers: [AdminLoginService, AuthService],
  exports: [AdminLoginService],
})


@Injectable()
export class AdminLoginService {

  private apiUrl = `${environment.baseURL}api/`;
  [x: string]: any;
  constructor(
    @InjectRepository(_dbadmin)
    private readonly userRepository: Repository<_dbadmin>,
    private readonly authService: AuthService,
  ) {}

  create(user: User): Observable<User> {

    return this.authService.hashPassword(user.password).pipe(
      switchMap((passwordHash: string) => {
        const newUser = new _dbadmin();
        newUser.username = user.username;
        newUser.password = passwordHash;
        newUser.role = user.role;

        return from(this.userRepository.save(newUser)).pipe(
          map((user: User) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...result } = user;
            return result;
          }),
          catchError((err) => throwError(err)),
        );
      }),
    );
  }

  findOne(id: number): Observable<User> {
    return from(this.userRepository.findOne({ where: { id } })).pipe(
      switchMap((user: User | null) => {
        if (!user) {
          return throwError(() => new Error('User not found'));
        }
        return of(user);
      }),
      catchError((error) => throwError(() => new Error('Error finding user')))
    );
  }

  findAll(): Observable<User[]> {
    return from(this.userRepository.find()).pipe(
      map((users: User[]) => {
        users.forEach(function (v) {
          delete v.password;
        });
        return users;
      }),
    );
  }

  deleteOne(id: number): Observable<any> {
    return from(this.userRepository.delete(id));
  }

  //TRY AND ERROR
  updateOne(id: number, user: Partial<User>): Observable<User> {
    console.log("Updating user")
    let emailChanged = false;
    return this.findOne(id).pipe(
      switchMap(existingUser => {
        if (!existingUser) {
          return throwError(() => new Error('User not found'));
        }
        //if there are changes in email
        if (user.email && user.email !== existingUser.email) { 
          console.log("Email changed");
          emailChanged = true;
          
          // Generate OTP and set verification properties
          user.verify_otp = (parseInt(randomBytes(3).toString('hex'), 16) % 1000000).toString().padStart(6, '0');
          user.verify_expiry = new Date(new Date().getTime() + 10 * 60 * 1000); // OTP expiry in 10 minutes
          user.verified = false;
        }
  
        // Update user details
        if (user.password) {
          return this.authService.hashPassword(user.password).pipe(
            switchMap((hashedPassword: string) => 
              from(this.userRepository.update(id, { ...user, password: hashedPassword })).pipe(
                switchMap(() => this.findOne(id)),
                catchError((error) => throwError(() => new Error('Error updating user')))
              )
            ),
            catchError((error) => throwError(() => new Error('Error hashing password')))
          );
        } else {
          return from(this.userRepository.update(id, user)).pipe(
            switchMap(() => this.findOne(id)),
            catchError((error) => throwError(() => new Error('Error updating user')))
          );
        }
      }),
      catchError((error) => throwError(() => new Error('Error finding user')))
    );
  }
  
  validateOldPassword(userId: number, oldPassword: string): Observable<boolean> {
    return from(this.userRepository.findOne({ where: { id: userId } })).pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('User not found'));
        }
        return this.authService.comparePassword(oldPassword, user.password).pipe(
          map(isMatch => isMatch),
          catchError(error => throwError(() => new Error('Error validating old password')))
        );
      }),
    );
  }
  
  login(user: User): Observable<{ token: string; user: User } | string> {
    return this.validateUser(user.email, user.password).pipe(
      switchMap((validatedUser: User) => {
        if (validatedUser) {
          // Get the user details by ID
          return this.findOne(validatedUser.id).pipe(
            switchMap((userDetails: User) => {
              return this.authService.generateJWT(userDetails).pipe(
                map((jwt: string) => {
                  // Log the current user details
                  
                  return { token: jwt, user: userDetails };
                }),
                catchError((error) => {
                  return throwError('Error generating JWT');
                })
              );
            }),
            catchError((error) => {
              return throwError('Error fetching user details');
            })
          );
        } else {
          // Return an error message if user credentials are incorrect
          return throwError('Wrong Credentials');
        }
      }),
      catchError((error) => {
        // Handle any unexpected errors
        return throwError('Login failed');
      })
    );
  }
  
  validateUser(email: string, password: string): Observable<User> {
    return this.findbyusername(email).pipe(
      switchMap((user: User) =>
        this.authService.comparePassword(password, user.password).pipe(
          map((match: boolean) => {
            if (match) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { password, ...result } = user;
              return result;
            } else {
              throw Error;}
          }),
        ),
      ),
    );
  }

  findbyusername(username: string): Observable<User> {
    return from(this.userRepository.findOne({ where: { username } }));

  }

  findByEmail(email: string): Observable<User | { error: string }> {
    return from(this.userRepository.findOne({ where: { email } })).pipe(
      switchMap((user: User | null) => {
        if (!user) {
          return of({ error: 'User not found' });
        }
        const { password, ...result } = user;
        return of(result as User);
      }),
      catchError((error) => throwError(() => new Error('Error finding user by email')))
    );
  }

  updateUserOtp(id: number, otpPayload: { otp_code: string, otp_expiry: Date }): Observable<User> {
    return from(this.userRepository.update(id, otpPayload)).pipe(
      switchMap(() => this.findOne(id)), // Replace `findOne(id)` with actual method to fetch user by ID
      catchError((error) => throwError(() => new Error('Error updating OTP')))
    );
  }

}