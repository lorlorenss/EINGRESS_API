import {Body,Controller,Get,Param,Post,Delete,Put, UseGuards, Query, HttpException, HttpStatus,} from '@nestjs/common';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { User } from '../models/user.interface';
import { AdminLoginService } from '../services/admin-login.service';

@Controller('users')
export class AdminLoginController {
  constructor(private userService: AdminLoginService) {}

  @Post()
  create(@Body() user: User): Observable<User | Object> {
    return this.userService.create(user).pipe(
      map((user: User) => user),
      catchError((err) => of({ error: err.message })),
    );
  }

  @Post('/validate-old-password')
  validateOldPassword(@Body() body: { userId: number, oldPassword: string }): Observable<boolean> {
    const { userId, oldPassword } = body;
    return this.userService.validateOldPassword(userId, oldPassword);
  }

@Post('login')
login(@Body() user: User): Observable<Object> {
    return this.userService.login(user).pipe(
        map((jwt: string) => {
            return { access_token: jwt };
        })
    )
}
    @Get(':id') // Route for findOne
    findOne(@Param() params): Observable<User> {
      return this.userService.findOne(params.id);
    }
    
  @Get() // Route for findAll
  findAll(): Observable<User[]> {
    return this.userService.findAll();
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string): Observable<any> {
    return this.userService.deleteOne(Number(id));
  }

 
  @Put(':id')
  updateOne(@Param('id') id: number, @Body() user: Partial<User>): Observable<{ message: string; user: User }> {
    return this.userService.findOne(id).pipe( // Assuming this method gets the existing user
      switchMap(existingUser => 
        this.userService.updateOne(id, user).pipe(
          map(updatedUser => {
            // Check if the email was changed
            const emailChanged = user.email && user.email !== existingUser.email;
  
            const message = emailChanged
              ? 'User updated successfully with new email'
              : 'User updated successfully with same email';
  
            return { message, user: updatedUser };
          }),
          catchError(error => {
            console.error('Error updating user:', error);
            throw new HttpException('Error updating user', HttpStatus.INTERNAL_SERVER_ERROR);
          })
        )
      )
    );
  }
  
}
