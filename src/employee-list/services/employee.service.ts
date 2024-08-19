import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Observable, from, map, switchMap,mergeMap, throwError, catchError, of } from 'rxjs';
import { Employee } from '../models/employee.interface';
import { _dbemployee } from '../models/employee.entity';
import { _dbaccesslog } from '../../access-log/models/access-log.entity';  // Update this import path
import { AccessLogService } from 'src/access-log/services/access-log.service';
import { register } from 'module';


@Injectable()
export class EmployeeService {
    constructor(
        @InjectRepository(_dbemployee)
        private readonly userRepository: Repository<_dbemployee>,
        private readonly accessLogService: AccessLogService,
        @InjectRepository(_dbaccesslog)
        private readonly accessLogRepository: Repository<_dbaccesslog>,
    ) {}


    create(employee: Employee): Observable<Employee> {
      return this.checkDuplicateFingerprint(employee).pipe(
        switchMap(existingEmployee => {
          if (existingEmployee) {
            // Throw a BadRequestException with the specific error message
            throw new BadRequestException(
              `Fingerprint already exists for another employee: ${existingEmployee.fullname}`
            );
          }
    
          // Set default values if they are not provided
          if (!employee.lastlogdate) {
            employee.lastlogdate = '';
          }
    
          if (!employee.rfidtag) {
            employee.rfidtag = null;
          }
    
          if (!employee.fingerprint1) {
            employee.fingerprint1 = '';
          }
    
          if (!employee.fingerprint2) {
            employee.fingerprint2 = '';
          }
    
          // Save the employee to the repository
          return from(this.userRepository.save(employee));
        }),
        catchError(error => {
          console.error('Error creating employee:', error);
          // Check if the error is an instance of BadRequestException
          if (error instanceof BadRequestException) {
            // Re-throw the error to be caught by the caller
            return throwError(error);
          } else {
            // Return a generic error message for other types of errors
            return throwError(new BadRequestException('An error occurred while creating the employee.'));
          }
        })
      );
    }

    findOne(id: number): Observable<Employee> {
        return from(this.userRepository.findOne({ where: { id } }));
    }

    findAll(): Observable<Employee[]> {
        return from(this.userRepository.find({relations:['accessLogs']}));
    }

    findByRfidTag(rfidTag: string): Observable<_dbemployee> {
        console.log('RFID Tag input:', rfidTag);
        return from(this.userRepository.findOne({ where: { rfidtag: rfidTag } })).pipe(
          catchError(err => {
            console.error('Error finding employee by RFID tag:', err);
            return throwError(new NotFoundException('Employee not found for RFID tag'));
          })
        );
      }
    
      logEmployeeAccess(fingerprint: string, rfid: string): Observable<any> {
        return from(this.userRepository.findOne({ where: { rfidtag: rfid } })).pipe(
            switchMap((employee: _dbemployee) => {
                if (!employee) {
                    throw new BadRequestException('Employee not found');
                }
    
                console.log('Employee found:', employee);
    
                // Check if neither fingerprint matches
                if (employee.fingerprint1 !== fingerprint && employee.fingerprint2 !== fingerprint) {
                    throw new BadRequestException('Fingerprint does not match');
                }
  
    
                const currentDate = new Date();
                const options: Intl.DateTimeFormatOptions = {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    timeZone: 'Asia/Manila',
                };
                const dateAndTimeInPhilippineTime = currentDate.toLocaleString('en-PH', options);
                employee.lastlogdate = dateAndTimeInPhilippineTime;
    
    
                return from(this.userRepository.save(employee)).pipe(
                    switchMap(() => this.accessLogService.logAccess(rfid, fingerprint)),
                    map(() => ({
                        fullname: employee.fullname,
                        role: employee.role,
                        profileImage: employee.profileImage,
                    })),
                );
            }),
            catchError((error) => {
                if (error instanceof BadRequestException) {
                    console.error('Error logging employee access:', error.message);
                }
                return throwError(error);
            }),
        );
    }
    private checkDuplicateFingerprint(employee: Employee, idToExclude?: number): Observable<{ fullname: string, branch: string } | void> {
      // Create a query builder instance
      const queryBuilder = this.userRepository.createQueryBuilder('user');
    
      // Add conditions to the query builder based on the fingerprints
      if (employee.fingerprint1) {
        queryBuilder
          .orWhere('(user.branch = :branch AND (user.fingerprint1 = :fingerprint1 OR user.fingerprint2 = :fingerprint1))', {
            branch: employee.branch,
            fingerprint1: employee.fingerprint1,
            idToExclude
          });
      }
    
      if (employee.fingerprint2) {
        queryBuilder
          .orWhere('(user.branch = :branch AND (user.fingerprint1 = :fingerprint2 OR user.fingerprint2 = :fingerprint2))', {
            branch: employee.branch,
            fingerprint2: employee.fingerprint2,
            idToExclude
          });
      }
    
      // Exclude the current employee from the results
      if (idToExclude) {
        queryBuilder.andWhere('user.id != :idToExclude', { idToExclude });
      }
    
      return from(queryBuilder.getOne()).pipe(
        map(existingEmployee => {
          if (existingEmployee && (existingEmployee.fingerprint1 || existingEmployee.fingerprint2)) {
            throw new BadRequestException(
              `Fingerprint already exists for another employee: ${existingEmployee.fullname} in branch: ${existingEmployee.branch}.`
            );
          }
        })
      );
    }
    
    
    private checkDuplicateFingerprintIgnoreID(employee: Employee, idToExclude?: number): Observable<{ fullname: string, branch: string } | void> {
      const queryConditions = [];
    
      // Add condition for fingerprint1 if it is not an empty string
      if (employee.fingerprint1 && employee.fingerprint1.trim() !== '') {
        queryConditions.push(
          {
            branch: employee.branch,
            fingerprint1: employee.fingerprint1,
            id: Not(idToExclude),
          },
          {
            branch: employee.branch,
            fingerprint2: employee.fingerprint1,
            id: Not(idToExclude),
          }
        );
      }
    
      // Add condition for fingerprint2 if it is not an empty string
      if (employee.fingerprint2 && employee.fingerprint2.trim() !== '') {
        queryConditions.push(
          {
            branch: employee.branch,
            fingerprint1: employee.fingerprint2,
            id: Not(idToExclude),
          },
          {
            branch: employee.branch,
            fingerprint2: employee.fingerprint2,
            id: Not(idToExclude),
          }
        );
      }
    
      // If no valid fingerprints are provided, skip the check
      if (queryConditions.length === 0) {
        return of(undefined); // No fingerprints to check, return an observable with no value
      }
    
      // Perform the query to find any existing employees with matching fingerprints
      return from(this.userRepository.findOne({
        where: queryConditions,
      })).pipe(
        map(existingEmployee => {
          if (existingEmployee) {
            throw new BadRequestException(
              `Fingerprint already exists for another employee: ${existingEmployee.fullname} in branch: ${existingEmployee.branch}.`
            );
          }
        })
      );
    }
    
      
      getOnlyDate(datetime: string): string {
        const date = new Date(datetime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
      
        return `${year}-${month}-${day}`;
      }
      
    
    
    deleteOne(id: number): Observable<any> {
        return from(this.userRepository.delete(id));
    }

    deleteEmployeeWithAccessLogs(id: number): Observable<any> {
      return from(this.userRepository.findOne({ where: { id } })).pipe(
          switchMap(user => {
              if (!user) {
                  throw new BadRequestException('User not found');
              }
              // Delete associated access logs
              return from(this.accessLogRepository.delete({ employee: user }));
          }),
          switchMap(() => this.userRepository.delete(id)) // Delete the user
      );
  }

  
  updateOne(id: number, employee: Employee): Observable<Employee> {
    return this.checkDuplicateFingerprintIgnoreID(employee, id).pipe(
      switchMap(() => {
        return from(this.userRepository.update(id, employee)).pipe(
          switchMap(() => this.findOne(id)),
          catchError(error => {
            console.error('Error updating employee:', error);
            return throwError(new BadRequestException('An error occurred while updating the employee.'));
          })
        );
      })
    );
  }
  
  

    countEmployees(): Observable<number> {
      return from(this.userRepository.count());
  }

}

  
  
