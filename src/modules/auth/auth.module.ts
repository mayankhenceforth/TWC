import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SmsModule } from 'src/comman/SMS/sms.module';
import { TokenModule } from 'src/comman/token/token.module';
import { MailModule } from 'src/comman/Mail/mail.module';
import { GuardModule } from 'src/comman/Guards/guards.module';
import { ConfigModule } from '@nestjs/config';
import { AuthGuards } from 'src/comman/Guards/auth.guards';
import { RoleGuards } from 'src/comman/Guards/role.guards';

@Module({
  imports:[SmsModule,TokenModule,MailModule,GuardModule ,ConfigModule],
  providers: [AuthService,AuthGuards ,RoleGuards],
  controllers: [AuthController]
})
export class AuthModule {}
