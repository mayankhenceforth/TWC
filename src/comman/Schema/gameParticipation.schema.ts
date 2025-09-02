import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type GameParticipationDocument = GameParticipation & Document;

@Schema({ timestamps: true })
export class GameParticipation {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Game" })
  gameId: Types.ObjectId;

  @Prop({ required: false })
  couponUsed?: string;

  @Prop({ required: true, min: 0 })
  amountPaid: number;

  @Prop({ required: true, default: "joined" })
  status: "joined" | "completed" | "won" | "lost";

  @Prop({ required: false })
  position?: number;

  @Prop({ required: false })
  score?: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const GameParticipationSchema = SchemaFactory.createForClass(GameParticipation);