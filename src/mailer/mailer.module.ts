import { Module } from '@nestjs/common';
import { MailerService } from './services/mailer.service';
import { MailerController } from './controllers/mailer.controller';
import { ConfigModule } from '@nestjs/config';
import { AdminLoginModule } from 'src/admin-login/admin-login.module';

@Module({
  imports: [ConfigModule, AdminLoginModule],
  controllers: [MailerController],
  providers: [MailerService],
})
export class MailerModule {
  static forRoot: any;
}
