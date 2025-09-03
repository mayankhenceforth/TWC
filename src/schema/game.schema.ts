import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { GameStatus, GameType } from "src/enums/game.enum";
import { TransactionStatus } from "src/enums/transaction.enum";


export type GameDocument = Game & Document

@Schema({ timestamps: true })
export class Game {
    @Prop({ required: true })
    title: string

    @Prop({ required: true })
    caption: string

    @Prop({ required: true, default: 0, min: 0 })
    playAmount: number

    @Prop({ required: true, default: 0, min: 0 })
    numberOfPlayers: number

    @Prop({ required: true, default: 0, min: 0 })
    numberOfWinners: number

    @Prop({ required: false })
    description?: string

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ required: true, type: Types.ObjectId, ref: "User" })
    createdBy: Types.ObjectId;

    @Prop({ required: true, enum:GameStatus, default:GameStatus.UPCOMING})
    status:GameStatus;

    @Prop({ required: true })
    startTime: Date;

    @Prop({ required: false })
    endTime?: Date;

    @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
    participantIds: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: "User", required: false })
    winnerId?: Types.ObjectId;

    @Prop({ required: false })
    imageUrl?: string;

    @Prop({ required: false })
    imagePublicId?: string;

    @Prop({ required: false })
    videoUrl?: string;

    @Prop({ required: false })
    videoPublicId?: string;

    @Prop({ required: true, min: 0 })
    duration: number;

    @Prop({ required: true, enum: ["minutes", "hours", "days"] })
    durationUnit: "minutes" | "hours" | "days";

    @Prop({ required: false })
    couponCode?: string;

    @Prop({ required: false })
    couponDiscount?: number;

    @Prop({ required: false, enum: ["percentage", "fixed"] })
    couponType?: string;

    @Prop({ required: true, enum: GameType })
    gameType: GameType;

    @Prop({required:true ,enum:TransactionStatus,default:TransactionStatus.PENDING})
    transactionStatus:TransactionStatus

    @Prop({required:true ,type:Boolean ,default:false})
    isTicketGenrated:boolean
}

export const GameSchema = SchemaFactory.createForClass(Game)