import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Payout, PayoutSchema, PendingUser, PendingUserSchema, User, UserSchema } from "../Schema/user.schema";
import { Game, GameSchema } from "../Schema/game.schema";
import { GameParticipation, GameParticipationSchema } from "../Schema/gameParticipation.schema";


@Global()
@Module({
    imports: [MongooseModule.forFeature([
        {name: User.name ,schema:UserSchema},
        {name:PendingUser.name , schema:PendingUserSchema},
        {name:Payout.name , schema:PayoutSchema},
        {name:Game.name ,schema:GameSchema},
        {name:GameParticipation.name ,schema:GameParticipationSchema}
    ])],
    providers: [],
    exports: [MongooseModule]


})

export class DatabaseModule { }