import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, name: string, verificationLink: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email Address',
      text: `Hello ${name},\n\nPlease verify your email address by clicking the link below:\n\n${verificationLink}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nCollabry Team`, 
    });
  }

  async sendResetPasswordEmail(email: string, name: string, resetLink: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Password',
      text: `Hello ${name},\n\nYou requested to reset your password. Please click the link below to reset it:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nCollabry Team`, 
    });
  }
}