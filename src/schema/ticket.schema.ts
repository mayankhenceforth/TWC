import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
 
export type TicketDocument = Ticket & Document

@Schema({timestamps:true})
export class Ticket{
  @Prop({ type: Types.ObjectId, ref: "Game", required: true })
  gameId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: false })
  userId?: Types.ObjectId;

  @Prop({required:true})
  title:string

}

export const TicketSchema = SchemaFactory.createForClass(Ticket)