import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type AccountDocument = Account & Document

@Schema({ timestamps: true })
export class Account {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId

    @Prop({ required: true })
    country: string

    @Prop({ required: true })
    accountNumber: number;

    @Prop({ required: true })
    routingNumber: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const AccountSchema = SchemaFactory.createForClass(Account)