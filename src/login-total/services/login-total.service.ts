import { Injectable } from '@nestjs/common';
import { _dblogstotal } from '../models/logs-total.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { totalLogs } from '../models/logs-total.interface';
import { Observable, from } from 'rxjs';
import { Between } from 'typeorm';
@Injectable()
export class LoginTotalService {
    constructor(
        @InjectRepository(_dblogstotal)
        private readonly totalLogsRepository: Repository<_dblogstotal>,
      ) {}
    
      // Method to retrieve today's login statistics
      getTodayLoginStatistics(): Observable<totalLogs> {
         const currentDate = new Date().toLocaleDateString();
         return from(this.totalLogsRepository.findOne({ where: { date: new Date(currentDate) } }));
      }

      // Method to update today's login statistics
      updateTodayLoginStatistics(loginstoday: string, notlogin: string): Observable<any> {
          const currentDate = new Date().toLocaleDateString();
          return from(this.totalLogsRepository.update({ date: new Date(currentDate) }, { loginstoday, notlogin }));
      }
    

      // Inside your service class
      getLogsForCurrentMonth(): Observable<totalLogs[]> {
          const currentDate = new Date();
          const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const endOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          return from(this.totalLogsRepository.find({ where: { date: Between(startOfCurrentMonth, endOfCurrentMonth) } }));
      }
      
      create(loginstoday: string, notlogin: string): Observable<totalLogs> {
        const currentDate = new Date().toLocaleDateString();
        const newEntry: DeepPartial<_dblogstotal> = {
          date: new Date(currentDate),
          loginstoday,
          notlogin
        };
        return from(this.totalLogsRepository.save(newEntry));
      }
      
      createPostman(totalLogdata: totalLogs): Observable<totalLogs>{
            return from(this.totalLogsRepository.save(totalLogdata));
            }

      findOne(id:number): Observable<totalLogs>{
        return from(this.totalLogsRepository.findOne({where: {id}}));
      }
      findAll(): Observable<totalLogs[]>{
        return from(this.totalLogsRepository.find());
      }
      deleteOne(id:number): Observable<any> {
        return from(this.totalLogsRepository.delete(id));
      }
      
      updateOne(id:number, totalLogdata: totalLogs): Observable<any> {
        return from(this.totalLogsRepository.update(id,totalLogdata));
      }
      
}