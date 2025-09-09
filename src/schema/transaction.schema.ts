import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { RefundStatus, TransactionMethod, TransactionStatus, TransactionType } from 'src/enums/transaction.enum';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: false })
    gameId: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, type: Number })
    amount: number;

    @Prop({ default: 'USD' })
    currency: string;

    @Prop({ required: true, enum: TransactionStatus, default: TransactionStatus.PENDING })
    status: TransactionStatus;

    @Prop({ required: false })
    transactionId: string;

    @Prop({ required: true, enum: TransactionMethod })
    transactionMethod: TransactionMethod;

    @Prop({ required: false })
    checkoutSessionId: string;

    @Prop({ type: Number, default: 0 })
    refundAmount: number;

    @Prop({ type: Number, default: 0 })
    refundPercentage: number;

    @Prop({ enum: RefundStatus, default: RefundStatus.NONE })
    refundStatus: RefundStatus;

    @Prop({ default: '' })
    refundId: string;

    @Prop()
    refundReason: string;

    @Prop({ type: Date })
    refundedAt: Date;

    // @Prop({ required: true, enum: TransactionType })
    // type: TransactionType;

    @Prop({ required: false })
    stripeSubscriptionId: string;

    @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Plan' })
    oldPlanId: mongoose.Types.ObjectId;

    @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Plan' })
    newPlanId: mongoose.Types.ObjectId;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);