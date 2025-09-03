import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schema/user.schema';
import { AuthGuards } from './auth.guards';
import { RoleGuards } from './role.guards';



@Module({
    imports: [
        ConfigModule,
        JwtModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    providers: [AuthGuards, RoleGuards],
    exports: [AuthGuards, RoleGuards],
})
export class GuardModule { }