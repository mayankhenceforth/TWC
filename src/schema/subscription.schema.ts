import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { SubscriptionStatus } from "src/enums/subscription.enum";

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Plan" })
  planId: Types.ObjectId;

  @Prop({ required: false })
  startDate: Date;

  @Prop({ required: false })
  endDate: Date;

  @Prop({ default: true })
  autoRenew: boolean;

  @Prop({ required: true, enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Prop({ required: false })
  stripeSubscriptionId?: string;

  @Prop({ required: false })
  currentPeriodStart: Date;

  @Prop({ required: false })
  currentPeriodEnd: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
