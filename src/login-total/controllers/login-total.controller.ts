import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { _dblogstotal } from '../models/logs-total.entity';
import { LoginTotalService } from '../services/login-total.service';
import { totalLogs } from '../models/logs-total.interface';
import { Observable } from 'rxjs';

@Controller('total-logs')
export class LoginTotalController {
  constructor(private readonly totalLogsService: LoginTotalService) {}
    
        // Endpoint to get today's login statistics
      @Get('today')
      getTodayLoginStatistics(): Observable<totalLogs> {
          return this.totalLogsService.getTodayLoginStatistics();
      }

      // Endpoint to update today's login statistics
      @Put('today')
      updateTodayLoginStatistics(@Body() loginData: totalLogs): Observable<any> {
          const { loginstoday, notlogin } = loginData;
          return this.totalLogsService.updateTodayLoginStatistics(loginstoday, notlogin);
      }

      @Get('current-month')
        getLogsForCurrentMonth(): Observable<totalLogs[]> {
            return this.totalLogsService.getLogsForCurrentMonth();
        }

      @Post()
      createPostman(@Body() accessLogData: totalLogs): Observable<totalLogs> {
          //  const { loginstoday, notlogin } = loginData;
        // Since create returns a plain entity, no need for await
      return this.totalLogsService.createPostman(accessLogData);
      }
      
      @Post('default-entry')
      create(@Body() body: { loginstoday: string; notlogin: string }): Observable<totalLogs> {
        const { loginstoday, notlogin } = body;
        return this.totalLogsService.create(loginstoday, notlogin);
      }

      @Get(':id')
      findOne(@Param()params):Observable<totalLogs> {
        return this.totalLogsService.findOne(params.id)
      }

      @Get(':id')
      findAll():Observable<totalLogs[]> {
        return this.totalLogsService.findAll()
      }

      @Delete(':id')
      deleteOne(@Param('id')id:string):Observable<totalLogs> {
        return this.totalLogsService.deleteOne(Number(id))
      }
      @Put(':id')
      updateOne(@Param('id')id:string, @Body() accessLogData: totalLogs):Observable<any> {
        return this.totalLogsService.updateOne(Number(id),accessLogData)
      }
}
