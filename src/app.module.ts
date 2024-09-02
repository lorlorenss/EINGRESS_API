import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { config } from './orm.config';
import { AuthModule } from './auth/auth.module';
import { AdminLoginModule } from './admin-login/admin-login.module';
import { EmployeeListModule } from './employee-list/employee-list.module';
import { AccessLogModule } from './access-log/access-log.module';
import { LoginTotalModule } from './login-total/login-total.module';
import { ErrorLogModule } from './error-log/error-log.module';
import { MailerModule } from './mailer/mailer.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';


@Module({
  // imports: [TypeOrmModule.forRoot(config)],
  // controllers: [AppController],
  // providers: [AppService],

  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      url: process.env.POSTGRES_URL,
    // port: parseInt(<string>process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AdminLoginModule,
    AuthModule,
    EmployeeListModule,
    AccessLogModule,
    LoginTotalModule,
    ErrorLogModule,
    MailerModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'mailer'), // Serve files from src/mailer
      serveRoot: '/static', // The route where your static files will be served
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}