import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Role } from "src/enums/role.enum";

export type PendingUserDocument = PendingUser & Document
export type UserDocument = User & Document

@Schema({ timestamps: true })
export class User {

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    username: string;

    @Prop({ required: true, unique: false })
    contactNumber: string;

    @Prop({
        required: false,
        unique: false,
        trim: true,
        lowercase: true,
    })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: false })
    profileImageUrl?: string;

    @Prop({ required: false })
    profileImagePublicId?: string;

    @Prop({ required: true, enum: Role, default: Role.User })
    role: Role;


    @Prop({ required: true, default: false })
    isVerified: boolean;

    @Prop()
    refreshToken: string;

    @Prop()
    otp?: Number;

    @Prop()
    otpExpiresAt?: Date;

    @Prop({
        enum: ["forgot-password", "registration", "login", "none"],
    })
    otpType: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Payout' }], default: [] })
    payoutIds: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: 'Wallet' })
    walletId: Types.ObjectId

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ required: false })
    stripeCustomerId: string

}

@Schema({ timestamps: true })
export class PendingUser {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    username: string;

    @Prop({ required: true, unique: false })
    contactNumber: string;

    @Prop({
        required: false,
        unique: false,
        trim: true,
        lowercase: true,
    })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, default: "user" })
    role: "admin" | "user" | "super-admin";

    @Prop({ required: true, default: false })
    isVerified: boolean;

    @Prop()
    refreshToken: string;

    @Prop({
        enum: ["forgot-password", "registration", "login"],
    })
    otpType: string;

    @Prop()
    otp?: Number;

    @Prop()
    otpExpiresAt?: Date;

    @Prop({
        default: Date.now,
        index: { expires: "5m" },
    })
    createdAt: Date;

}

export const UserSchema = SchemaFactory.createForClass(User)
export const PendingUserSchema = SchemaFactory.createForClass(PendingUser)