import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/db.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigureDB } from './database/db';
import { SmsModule } from './sms/sms.module';
import { TokenModule } from './token/token.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';

import { JwtModule } from '@nestjs/jwt';

import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { GuardModule } from './guards/guards.module';
import { GameModule } from './game/game.module';
import { TicketModule } from './ticket/ticket.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { PlanModule } from './plan/plan.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { AccountModule } from './Account/account.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
       global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    ConfigureDB(),
    DatabaseModule,

    // Feature Modules
    AuthModule,
    UserModule,
    AccountModule,
    GameModule,

    // Common Functional Modules
    SmsModule,
    TokenModule,
    MailModule,
    GuardModule,
    CloudinaryModule,
    TicketModule,
    WalletModule,
    TransactionModule,
    PlanModule,
    SubscriptionModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
