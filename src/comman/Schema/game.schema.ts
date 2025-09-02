import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {


    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ required: true, trim: true })
    description: string;

    @Prop({ required: false })
    imageUrl?: string;

    @Prop({ required: false })
    imagePublicId?: string;

    @Prop({ required: false })
    videoUrl?: string;

    @Prop({ required: false })
    videoPublicId?: string;

    @Prop({ required: true, min: 1 })
    maxParticipants: number;

    @Prop({ required: true, default: 0, min: 0 })
    currentParticipants: number;


    @Prop({ required: true, min: 0 })
    duration: number;

    @Prop({ required: true, enum: ["minutes", "hours", "days"] })
    durationUnit: string;

    @Prop({ required: true, min: 0 })
    entryPrice: number;

    @Prop({ required: true, min: 0 })
    winnerPrice: number;

    @Prop({ required: false })
    couponCode?: string;

    @Prop({ required: false })
    couponDiscount?: number; // in percentage or fixed amount

    @Prop({ required: false, enum: ["percentage", "fixed"] })
    couponType?: string;

    @Prop({ required: true, default: "upcoming" })
    status: "upcoming" | "ongoing" | "completed" | "cancelled";

    @Prop({ required: true })
    startTime: Date;

    @Prop({ required: false })
    endTime?: Date;

    @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
    participantIds: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: "User", required: false })
    winnerId?: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: "User" })
    createdBy: Types.ObjectId;

    @Prop({ required: false })
    rules?: string[];

    @Prop({ required: false })
    tags?: string[];

    @Prop({ required: false, default: 0 })
    views: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const GameSchema = SchemaFactory.createForClass(Game);