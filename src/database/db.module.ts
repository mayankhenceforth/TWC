import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {  PendingUser, PendingUserSchema, User, UserSchema } from "../schema/user.schema";
import { GameParticipation, GameParticipationSchema } from "../schema/gameParticipation.schema";
import { Game, GameSchema } from "src/schema/game.schema";
import { Ticket, TicketSchema } from "src/schema/ticket.schema";
import { Account, AccountSchema } from "src/schema/account.schema";
import { Wallet, WalletSchema } from "src/schema/wallet.schema";
import { Transaction, TransactionSchema } from "src/schema/transaction.schema";


@Global()
@Module({
    imports: [MongooseModule.forFeature([
        {name: User.name ,schema:UserSchema},
        {name:PendingUser.name , schema:PendingUserSchema},
        {name:Account.name , schema:AccountSchema},
        {name:Game.name ,schema:GameSchema},
        {name:GameParticipation.name ,schema:GameParticipationSchema},
        {name:Ticket.name ,schema:TicketSchema},
        {name:Wallet.name ,schema:WalletSchema},
        {name:Transaction.name ,schema:TransactionSchema}
    ])],
    providers: [],
    exports: [MongooseModule]


})

export class DatabaseModule { }