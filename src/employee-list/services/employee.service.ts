import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Observable, from, map, switchMap,mergeMap, throwError, catchError } from 'rxjs';
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
      console.log('EMPLOYEE FINAL VALUE ', employee);
  
      if (!employee.lastlogdate) {
        employee.lastlogdate = '';
      }
  
      if (!employee.rfidtag) {
        employee.rfidtag = null;
      }
  
      if (!employee.fingerprint1) {
        employee.fingerprint1 = null;
      }
      
      if (!employee.fingerprint2) {
        employee.fingerprint2 = null;
      }
  
      return from(this.userRepository.save(employee));
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
                
                // Check if neither fingerprint matches
                if (employee.fingerprint1 !== fingerprint && employee.fingerprint2 !== fingerprint) {
                    throw new BadRequestException('Fingerprint does not match');
                }
    
                // Check if the employee's RFID matches the stored RFID
                if (employee.rfidtag !== rfid) {
                    throw new BadRequestException('RFID does not match');
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
                    switchMap(() => this.accessLogService.logAccess(fingerprint)),
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
        return from(this.userRepository.update(id, employee)).pipe(
            switchMap(() => this.findOne(id))
        );
    }

    countEmployees(): Observable<number> {
      return from(this.userRepository.count());
  }

}

  
  
