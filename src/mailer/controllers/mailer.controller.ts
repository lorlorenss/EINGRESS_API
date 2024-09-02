import { Body, Controller, Post } from '@nestjs/common';
import { MailerService } from '../services/mailer.service';
import { SendEmailDto } from '../models/mail.interface';
import * as fs from 'fs';
import * as path from 'path';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) { }

  @Post('/send-verification')
  async sendVerification(@Body() body: Record<string, string>) {
    console.log("Sending verification");

    // Define file paths relative to the current file's location
    const htmlFilePath = path.join('src', 'mailer', 'templates', 'verification-email.html');
    const cssFilePath = path.join('src', 'mailer', 'templates', 'verification-style.css');

    // Read HTML and CSS files
    const htmlTemplate = fs.readFileSync(htmlFilePath, 'utf8');
    const cssStyles = fs.readFileSync(cssFilePath, 'utf8');

    // Embed CSS into HTML
    const htmlContent = `
          <style>${cssStyles}</style>
          <div>${htmlTemplate}</div>
    `;
    const recipientName = body.name || 'User';
    const recipientAddress = body.address || 'default@example.com';
    const dto: SendEmailDto = {
      // from: { name: 'Eingress', address: 'eingress@email.com'},
      recipients: [{ name: recipientName, address: recipientAddress }],
      subject: 'Account Email Verification for EINGRESS',
      html: htmlContent.replace(/%name%/g, body.name).replace(/%verification_link%/g, body.verification_link),
    };

    return await this.mailerService.sendEmail(dto);
  }


  @Post('/send-otp')
  async sendOtp(@Body() body: Record<string, any>) {
    console.log("Sending OTP");

    // Define file paths relative to the current file's location
    const htmlFilePath = path.join('src', 'mailer', 'templates', 'otp-email.html');
    const cssFilePath = path.join('src', 'mailer', 'templates', 'otp-style.css');

    // Read HTML and CSS files
    const htmlTemplate = fs.readFileSync(htmlFilePath, 'utf8');
    const cssStyles = fs.readFileSync(cssFilePath, 'utf8');

    // Replace placeholders in the HTML
    const otp = body.otp_digits ? String(body.otp_digits) : '000000';
    const otpDigits = otp.split('').map(digit => `<span class="otp-text">${digit}</span>`).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Verification</title>
            <style>${cssStyles}</style>
        </head>
        <body>
            ${htmlTemplate}
        </body>
        </html>
      `;
    const recipientName = body.name || 'User';
    const recipientAddress = body.address || 'default@example.com';
    const dto: SendEmailDto = {
      // from: { name: 'Eingress', address: 'eingress@email.com'},
      recipients: [{ name: recipientName, address: recipientAddress }],
      subject: 'OTP For EINGRESS',
      html: htmlContent.replace(/%name%/g, body.name).replace(/%otp_digits%/g, otpDigits),
    };

    return await this.mailerService.sendEmail(dto);
  }
}
