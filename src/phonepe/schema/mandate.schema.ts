// src/phonepe/mandate.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MandateDocument = Mandate & Document;

export enum MandateStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  EXECUTED = 'EXECUTED',
  REVOKED = 'REVOKED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Mandate {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  merchantTransactionId: string;

  @Prop({ required: true })
  mandateId: string;

  @Prop({ required: true })
  merchantId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @Prop({ required: true })
  startDate: string;

  @Prop({ required: true })
  endDate: string;

  @Prop({ required: true })
  recipientUpiId: string;

  @Prop({ required: true })
  recipientName: string;

  @Prop({ required: true })
  callbackUrl: string;

  @Prop({ required: true })
  redirectUrl: string;

  @Prop({ enum: MandateStatus, default: MandateStatus.PENDING })
  status: MandateStatus;

  @Prop({ type: Object, default: {} })
  phonePeResponse: any;

  @Prop({ type: Object, default: {} })
  callbackData: any;
}

export const MandateSchema = SchemaFactory.createForClass(Mandate);