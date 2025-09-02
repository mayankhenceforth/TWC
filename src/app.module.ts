import { Module } from '@nestjs/common';
import { DatabaseModule } from './comman/Database/db.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigureDB } from './comman/Database/db';
import { SmsModule } from './comman/SMS/sms.module';
import { TokenModule } from './comman/token/token.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MailService } from './comman/Mail/mail.service';
import { MailModule } from './comman/Mail/mail.module';
import { GuardModule } from './comman/Guards/guards.module';
import { JwtModule } from '@nestjs/jwt';
import { PayoutModule } from './modules/payout/payout.module';
import { CloudinaryModule } from './comman/cloudinary/cloudinary.module';
import { GameModule } from './modules/game/game.module';

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
    PayoutModule,
    GameModule,

    // Common Functional Modules
    SmsModule,
    TokenModule,
    MailModule,
    GuardModule,
    CloudinaryModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
