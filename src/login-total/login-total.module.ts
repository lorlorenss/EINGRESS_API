import { Module } from '@nestjs/common';
import { LoginTotalService } from './services/login-total.service';
import { LoginTotalController } from './controllers/login-total.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { _dblogstotal } from './models/logs-total.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([_dblogstotal]), // Import the AccessLog entity
  ],
  providers: [LoginTotalService],
  exports: [LoginTotalService],
  controllers: [LoginTotalController]
})
export class LoginTotalModule {}
