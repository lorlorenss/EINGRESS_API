import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from '../models/mail.interface';
import Mail from 'nodemailer/lib/mailer';
import { repl } from '@nestjs/core';

@Injectable()
export class MailerService {

    constructor(private readonly configService: ConfigService){}
    mailTransport() {
        const transporter = nodemailer.createTransport({
            host: this.configService.get<string>('MAIL_HOST'),
            port: this.configService.get<number>('MAIL_PORT'),
            secure: false, // Use `true` for port 465, `false` for all other ports
            auth: {
              user: this.configService.get<string>('MAIL_USER'),
              pass: this.configService.get<string>('MAIL_PASSWORD')
            },
          });

          return transporter;
    }

    template(html: string, replacements: Record<string, string>){
        return html.replace(
                /%(\w*)%/g,
                function (m, key) {
                    return replacements.hasOwnProperty(key) ? replacements [key] : '';
                },            
        );
    }

    async sendEmail(dto: SendEmailDto){
        const {from, recipients, subject} = dto;
        const html = dto.placeholderReplacements ? this.template(dto.html, dto.placeholderReplacements) : dto.html;
        const transport = this.mailTransport();
        const options: Mail.Options = {
            from: from ?? {
                address: this.configService.get<string>('DEFAULT_MAIL_FROM'),
                name: this.configService.get<string>('APP_NAME')
            },
            to: recipients,
            subject,
            html
        }
        try {
            const result = await transport.sendMail(options)
            return result;
        }
        catch (error){
            console.log("Error: ", error)
        }
    }
}
