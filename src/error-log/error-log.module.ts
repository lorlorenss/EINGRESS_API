import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {  _dberrorLog } from './models/error-log.entity';
import { ErrorLogService } from './services/error-log.service';
import { ErrorLogController } from './controllers/error-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([_dberrorLog])],
  providers: [ErrorLogService],
  controllers: [ErrorLogController],
})
export class ErrorLogModule {}
