// src/error-log/services/error-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { _dberrorLog } from '../models/error-log.entity';
import moment from 'moment-timezone';

@Injectable()
export class ErrorLogService {
  private readonly logger = new Logger(ErrorLogService.name);

  constructor(
    @InjectRepository(_dberrorLog)
    private readonly errorLogRepository: Repository<_dberrorLog>,
  ) {}

  async createErrorLog(errorLogData: Partial<_dberrorLog>): Promise<_dberrorLog> {
    try {
      // Set the timestamp to the current time in Philippine Time
      const timestamp = moment().tz('Asia/Manila').toDate();
      const errorLog = this.errorLogRepository.create({ ...errorLogData, timestamp });
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
//delete all error-logs 1month from now. 
  async deleteOldLogs(): Promise<void> {
    const oneMonthAgo = moment().tz('Asia/Manila').subtract(1, 'months').toDate();
    await this.errorLogRepository.delete({ timestamp: LessThan(oneMonthAgo) });
  }
}
