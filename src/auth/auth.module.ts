import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SmsModule } from 'src/sms/sms.module';
import { TokenModule } from 'src/token/token.module';
import { MailModule } from 'src/mail/mail.module';
import { GuardModule } from 'src/guards/guards.module';
import { ConfigModule } from '@nestjs/config';
import { AuthGuards } from 'src/guards/auth.guards';
import { RoleGuards } from 'src/guards/role.guards';

@Module({
  imports:[SmsModule,TokenModule,MailModule,GuardModule ,ConfigModule],
  providers: [AuthService,AuthGuards ,RoleGuards],
  controllers: [AuthController]
})
export class AuthModule {}
