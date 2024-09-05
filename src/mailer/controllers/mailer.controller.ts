import { Body, Controller, Post } from '@nestjs/common';

import { SendEmailDto } from '../models/mail.interface';
import * as fs from 'fs';
import * as path from 'path';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
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
  sendVerification(@Body() body: Record<string, string>) {
    console.log("Sending verification");
  
    // Define file paths relative to the current file's location
    const htmlFilePath = path.join('src', 'mailer', 'templates', 'verification-email.html');
    const cssFilePath = path.join('src', 'mailer', 'templates', 'verification-style.css');
  
    // Read HTML and CSS files
    const htmlTemplate = fs.readFileSync(htmlFilePath, 'utf8');
    const cssStyles = fs.readFileSync(cssFilePath, 'utf8');

    const verificationOtp = body.verification_otp.split('').map(digit => `<span class="otp-text">${digit}</span>`).join('');
    // Embed CSS into HTML
    const htmlContent = `
       <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account OTP Verification</title>
            <style>${cssStyles}</style>
        </head>
        <body>
            ${htmlTemplate}
        </body>
        </html>
    `;
  
    // Create the email DTO with replaced placeholders
    const dto = {
      recipients: [{ name: body.name, address: body.address }],
      subject: 'Account Email Verification OTP For EINGRESS',
      html: htmlContent.replace(/%name%/g, body.name).replace(/%verification_otp%/g, verificationOtp),
    };
  
    // Use from to convert the promise returned by sendEmail to an observable
    return from(this.mailerService.sendEmail(dto)).pipe(
      map(() => ({ message: 'Verification email sent successfully' })),
      catchError((err) => {
        console.error('Error sending verification email:', err);
        return of({ error: err.message });
      })
    );
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
      subject: 'Reset Password OTP For EINGRESS',
      html: htmlContent.replace(/%name%/g, body.name).replace(/%otp_digits%/g, otpDigits),
    };

    await this.mailerService.sendEmail(dto);
  }



  @Post('/validate-email')
  validateEmail(@Body() body: { email: string }): Observable<Object> {
    return this.adminLoginService.findByEmail(body.email).pipe(
      switchMap((response: User | { error: string }) => {
        if ('error' in response) {
          return of({ error: response.error });
        }

        const user = response as User;

        // Generate OTP only if user is verified
        if (user.verified) {
          const otpDigits = (parseInt(randomBytes(3).toString('hex'), 16) % 1000000).toString().padStart(6, '0');
          const otpPayload = {
            otp_code: otpDigits,  // Set OTP code
            otp_expiry: new Date(new Date().getTime() + 10 * 60 * 1000),  // OTP expires in 10 minutes
          };

          // Update the user's OTP code and expiry
          return this.adminLoginService.updateUserOtp(user.id, otpPayload).pipe(
            switchMap(() => {
              // Convert sendOtp() promise to observable
              return from(this.sendOtp({
                name: user.username,
                address: user.email,
                otp_digits: otpDigits,
              })).pipe(
                map(() => ({ message: 'OTP sent to your email address.' })),
                catchError((err) => of({ error: err.message }))
              );
            }),
            catchError((err) => of({ error: err.message }))
          );
        } else {
          return of({ error: 'Email not verified.' });
        }
      }),
      catchError((err) => of({ error: err.message }))
    );
  }

}
