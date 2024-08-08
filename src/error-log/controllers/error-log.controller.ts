// src/error-log/controllers/error-log.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Get, Delete } from '@nestjs/common';
import { ErrorLogService } from '../services/error-log.service';
import { _dberrorLog } from '../models/error-log.entity';

@Controller('error-logs')
export class ErrorLogController {
  constructor(private readonly errorLogService: ErrorLogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async logError(@Body() errorLogData: Partial<_dberrorLog>): Promise<{ message: string }> {
    try {
      await this.errorLogService.createErrorLog(errorLogData);
      return { message: 'Error log successfully created.' };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  async findAll(): Promise<_dberrorLog[]> {
    return this.errorLogService.findAll();
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll(): Promise<void> {
    try {
      await this.errorLogService.deleteAll();
    } catch (error) {
      throw error;
    }
  }

  @Delete('cleanup')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOldLogs(): Promise<void> {
    await this.errorLogService.deleteOldLogs();
  }
  
}
