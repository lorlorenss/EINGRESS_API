import { Module } from '@nestjs/common';
import { MailerService } from './services/mailer.service';
import { MailerController } from './controllers/mailer.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [MailerController],
  providers: [MailerService],
})
export class MailerModule {
  static forRoot: any;
}
