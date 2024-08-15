import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { _dberrorLog } from '../models/error-log.entity';
import * as moment from 'moment-timezone';
import { from, Observable } from 'rxjs';

@Injectable()
export class ErrorLogService {
  private readonly logger = new Logger(ErrorLogService.name);

  constructor(
    @InjectRepository(_dberrorLog)
    private readonly errorLogRepository: Repository<_dberrorLog>,
  ) {}

  async createErrorLog(errorLogData: Partial<_dberrorLog>): Promise<_dberrorLog> {
    try {
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
      const formattedDate = currentDate.toLocaleString('en-PH', options);

      const errorLog = this.errorLogRepository.create({
        ...errorLogData,
        timestamp: formattedDate,
      });
      const savedErrorLog = await this.errorLogRepository.save(errorLog);

      // Log the successful creation of the error log
      this.logger.log(`Successfully created error log with ID: ${savedErrorLog.id}`);
      
      return savedErrorLog;
    } catch (error) {
      // Log the error if something goes wrong
      this.logger.error('Failed to create error log', error.stack);
      throw error; // Rethrow the error after logging it
    }
  }

  async findAll(): Promise<_dberrorLog[]> {
    return this.errorLogRepository.find();
  }

  async deleteAll(): Promise<void> {
    try {
      await this.errorLogRepository.clear(); // Removes all records from the table
      this.logger.log('Successfully deleted all error logs');
    } catch (error) {
      this.logger.error('Failed to delete all error logs', error.stack);
      throw error;
    }
  }
  
  async deleteAllOlderThanOneMonth(): Promise<void> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const formattedDate = oneMonthAgo.toISOString();

    await this.errorLogRepository.createQueryBuilder()
      .delete()
      .from(_dberrorLog)
      .where("timestamp < :formattedDate", { formattedDate })
      .execute();
  }
}
