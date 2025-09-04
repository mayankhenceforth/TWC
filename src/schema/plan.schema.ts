import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { PlanDurationUnit, PlanFeature } from "src/enums/plan.enum";

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
    @Prop({ type: Types.ObjectId, ref: "User", required: true})
    createdBy: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true, enum: ['usd', 'inr'] })
    currency: string;

    @Prop({ required: true })
    duration: number;

    @Prop({ required: true, enum: PlanDurationUnit })
    durationUnit: PlanDurationUnit;

    @Prop({ required: true, type: [String], enum: PlanFeature })
    features: PlanFeature[];

    @Prop()
    stripeProductId: string;

    @Prop()
    stripePlanId: string;

    @Prop({ default: true })
    isActive: boolean;

}

export const PlanSchema = SchemaFactory.createForClass(Plan);
