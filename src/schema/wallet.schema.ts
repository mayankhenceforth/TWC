import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type WalletDocument = Wallet & Document
@Schema({ timestamps: true })
export class Wallet {

    @Prop({ type: Types.ObjectId, ref: "User", required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, default: 0 })
    amount: number

    @Prop({ type: Types.ObjectId, ref: "Account", required: false })
    accountId?: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: "Transaction" }], default: [] })
    transations: Types.ObjectId[];

    @Prop({ required: true, default: true })
    isActive: boolean


}

export const WalletSchema = SchemaFactory.createForClass(Wallet)

