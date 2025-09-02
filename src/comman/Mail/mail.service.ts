import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('NODEMAILER_EMAIL'),
        pass: this.configService.get<string>('NODEMAILER_PASSWORD'),
      },
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('NODEMAILER_EMAIL'),
      ...options,
    });

    console.log(`Email sent to ${options.to}`);
  }

  async sendOtpEmail(to: string, otp: number, type: 'verification' | 'forgot-password' | 'login') {
    let subject: string;
    let html: string;

    switch (type) {
      case 'verification':
        subject = 'Verify your account';
        html = `<p>Dear user,</p><p>Your OTP to verify your account is: <b>${otp}</b></p><p>This OTP is valid for 5 minutes.</p>`;
        break;
      case 'forgot-password':
        subject = 'Reset your password';
        html = `<p>Dear user,</p><p>Your OTP to reset your password is: <b>${otp}</b></p><p>This OTP is valid for 5 minutes.</p>`;
        break;
      case 'login':
        subject = 'Login OTP';
        html = `<p>Dear user,</p><p>Your OTP to login is: <b>${otp}</b></p><p>This OTP is valid for 5 minutes.</p>`;
        break;
    }

    await this.sendMail({ to, subject, html });
  }
}
