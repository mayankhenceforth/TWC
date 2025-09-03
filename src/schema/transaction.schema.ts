import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { RefundStatus, TransactionMethod, TransactionStatus } from 'src/enums/transaction.enum';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true })
    gameId: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, type: Number })
    amount: number;

    @Prop()
    currency: string

    @Prop({ required: true, enum: TransactionStatus, default:TransactionStatus.PENDING })
    status:TransactionStatus;

    @Prop({required:true})
    transactionId: string;

    @Prop({required:true,enum:TransactionMethod})
    transactionMethod: TransactionMethod
    

    @Prop({required:true})
    checkoutSessionId: string;

    @Prop({ type: Number, default: 0 })
    refundAmount?: number;

    @Prop({ type: Number, default: 0 })
    refundPercentage?: number;

    @Prop({ enum: RefundStatus, default: RefundStatus.NONE })
    refundStatus?: RefundStatus

    @Prop({ default: '' })
    refundId?: string

    @Prop()
    refundReason?: string;

    @Prop({ type: Date })
    refundedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
