import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  PROCESSING='PROCESSING'
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  merchantTransactionId: string;

  @Prop({ required: true })
  merchantId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  callbackUrl: string;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.INITIATED })
  status: PaymentStatus;

  @Prop({ type: Object, default: {} })
  phonePeResponse: any;

  @Prop({ type: Object, default: {} })
  callbackData: any;

  @Prop({ type: String, default:'' })
  redirectUrl: string;

  @Prop({ type: String, default:''})
  paymentInstrumentType: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);