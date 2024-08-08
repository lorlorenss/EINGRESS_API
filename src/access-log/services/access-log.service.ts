import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { _dbaccesslog } from './../../access-log/models/access-log.entity';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { _dbemployee } from 'src/employee-list/models/employee.entity';
import { ErrorLogService } from 'src/error-log/services/error-log.service';

@Injectable()
export class AccessLogService {
  constructor(
    @InjectRepository(_dbaccesslog)
    private readonly accessLogRepository: Repository<_dbaccesslog>,
    @InjectRepository(_dbemployee)
    private readonly employeeRepository: Repository<_dbemployee>,
  ) {}

  findAll(): Promise<_dbaccesslog[]> {
    return this.accessLogRepository.find();
  }

  findById(id: number): Promise<_dbaccesslog> {
    return this.accessLogRepository.findOne({where:{id}}).then((accessLog) => {
      if (!accessLog) {
        throw new NotFoundException(`Access log with ID ${id} not found`);
      }
      return accessLog;
    });
  }

  create(accessLogData: Partial<_dbaccesslog>): Promise<_dbaccesslog> {
    const newAccessLog = this.accessLogRepository.create(accessLogData);
    return this.accessLogRepository.save(newAccessLog);
  }

  update(id: number, accessLogData: Partial<_dbaccesslog>): Promise<_dbaccesslog> {
    return this.findById(id).then((accessLog) => {
      this.accessLogRepository.merge(accessLog, accessLogData);
      return this.accessLogRepository.save(accessLog);
    });
  }

  delete(id: number): Promise<any> {
    return this.findById(id).then((accessLog) => {
      return this.accessLogRepository.remove(accessLog);
    });
  }

  logAccess(rfid: string, fingerprint: string): Observable<void> {
    return from(this.employeeRepository.findOne({ where: { rfidtag: rfid } })).pipe(
        switchMap((employee: _dbemployee) => {
            if (!employee) {
                throw new BadRequestException('Employee not found');
            }

            if (employee.fingerprint1 !== fingerprint && employee.fingerprint2 !== fingerprint) {
                throw new BadRequestException('Fingerprint does not match');
            }

          

            const accessLogEntry: _dbaccesslog = {
                id: 0, // Provide a default value for id if it's not auto-generated
                rfidtag: employee.rfidtag,
                accessDateTime: new Date(),
                accessType: 'In', // or 'Out', depending on the logic
                roleAtAccess: employee.role,
                employee: employee,
                fingerprint1: employee.fingerprint1,
                fingerprint2: employee.fingerprint2,
            };

            console.log('Access log entry created:', accessLogEntry);

            return from(this.accessLogRepository.save(accessLogEntry)).pipe(
                catchError((error) => {
                    console.error('Error saving access log:', error);
                    return throwError('Error saving access log');
                }),
                switchMap(() => {
                    console.log('Access log saved successfully');
                    return from(Promise.resolve()); // Return an empty observable
                })
            );
        }),
        catchError((error) => {
            console.error('Error finding employee:', error);
            return throwError('Error finding employee');
        })
    );
}

  findByEmployeeId(employeeId: number): Promise<_dbaccesslog[]> {
    return this.accessLogRepository.find({ where: { employee: { id: employeeId } } });
  }

  findByDate(date: Date): Promise<_dbaccesslog[]> {
    // Filter access logs by date (ignoring time) and include additional information
    return this.accessLogRepository
      .createQueryBuilder('accessLog')
      .where('DATE(accessLog.accessDateTime) = :date', { date: date.toISOString().split('T')[0] })
      .select(['accessLog.id', 'accessLog.accessDateTime', 'accessLog.accessType'])
      .getMany()
      .then(filteredLogs => {
        if (!filteredLogs || filteredLogs.length === 0) {
          throw new NotFoundException(`No access logs found for date: ${date}`);
        }
        return filteredLogs;
      })
      .catch(error => {
        throw new Error(`Error fetching access logs by date: ${error.message}`);
      });
  }

}
