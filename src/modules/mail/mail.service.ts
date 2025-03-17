import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email Address',
      text: `Hello,\n\nPlease verify your email address using the OTP below:\n\n${otp}\n\nIf you did not create an account, please ignore this email.\n\nThanks,\nCollabry Team`,
    });
  }

  async sendResetPasswordEmail(email: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Password',
      text: `Hello,\n\n Your OTP Is :\n\n${otp}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nCollabry Team`, 
    });
  }
}