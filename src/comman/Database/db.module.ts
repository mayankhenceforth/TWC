import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Payout, PayoutSchema, PendingUser, PendingUserSchema, User, UserSchema } from "../Schema/user.schema";


@Global()
@Module({
    imports: [MongooseModule.forFeature([
        {name: User.name ,schema:UserSchema},
        {name:PendingUser.name , schema:PendingUserSchema},
        {name:Payout.name , schema:PayoutSchema}
    ])],
    providers: [],
    exports: [MongooseModule]


})

export class DatabaseModule { }