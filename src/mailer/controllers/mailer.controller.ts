import { Body, Controller, Post } from '@nestjs/common';

import { SendEmailDto } from '../models/mail.interface';
import * as fs from 'fs';
import * as path from 'path';
import { catchError, map, Observable, of } from 'rxjs';
import { User } from 'src/admin-login/models/user.interface';
import { AdminLoginService } from 'src/admin-login/services/admin-login.service';
import { randomBytes } from 'crypto';
import { Module } from '@nestjs/common';

import { MailerService } from '../services/mailer.service';
import { AdminLoginModule } from 'src/admin-login/admin-login.module'; // Import the module

@Controller('mailer')
export class MailerController {

  constructor(private readonly mailerService: MailerService, private adminLoginService: AdminLoginService) { }

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
  async sendOtp(@Body() body: { name: string, address: string, otp_digits: string }) {
    console.log("Sending OTP");

    // Define file paths relative to the current file's location
    const htmlFilePath = path.join('src', 'mailer', 'templates', 'otp-email.html');
    const cssFilePath = path.join('src', 'mailer', 'templates', 'otp-style.css');

    // Read HTML and CSS files
    const htmlTemplate = fs.readFileSync(htmlFilePath, 'utf8');
    const cssStyles = fs.readFileSync(cssFilePath, 'utf8');

    // Replace placeholders in the HTML
    const otpDigits = body.otp_digits.split('').map(digit => `<span class="otp-text">${digit}</span>`).join('');

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

    const dto = {
      recipients: [{ name: body.name, address: body.address }],
      subject: 'OTP For EINGRESS',
      html: htmlContent.replace(/%name%/g, body.name).replace(/%otp_digits%/g, otpDigits),
    };

    await this.mailerService.sendEmail(dto);
  }



  @Post('/validate-email')
  validateEmail(@Body() body: { email: string }): Observable<Object> {
    return this.adminLoginService.findByEmail(body.email).pipe(
      map((response: User | { error: string }) => {
        if ('error' in response) {
          // Return the error if found
          return { error: response.error };
        }
  
        const user = response as User;
        // Generate OTP only if user is verified
        if (user.verified) {
          const otpDigits = (parseInt(randomBytes(3).toString('hex'), 16) % 1000000).toString().padStart(6, '0');
          const otpPayload = {
            name: user.username,  // Assuming user.username contains the user's name
            address: user.email,
            otp_digits: otpDigits,
          };
          this.sendOtp(otpPayload);  // Send the OTP
          return { message: 'OTP sent to your email address.' };
        } else {
          return { error: 'Email not verified.' };
        }
      }),
      catchError((err) => of({ error: err.message }))
    );
  }
}
