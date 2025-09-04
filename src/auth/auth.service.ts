import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import {
  PendingUser,
  PendingUserDocument,
  User,
  UserDocument,
} from 'src/schema/user.schema';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TokenService } from 'src/token/token.service';
import { SmsService } from 'src/sms/sms.service';
import { LoginDto } from './dto/login.dto';
import { MailService } from 'src/mail/mail.service';
import { ApiResponse } from '@nestjs/swagger';
import { Account, AccountDocument } from 'src/schema/account.schema';
import { Wallet, WalletDocument } from 'src/schema/wallet.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(PendingUser.name)
    private pendingUserModel: Model<PendingUserDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private tokenService: TokenService,
    private smsService: SmsService,
    private mailService: MailService,
  ) {}

  private async getPendingUser(
    email: string,
  ): Promise<PendingUserDocument | null> {
    return this.pendingUserModel.findOne({ email }).exec();
  }

  private async generateAndStoreOtp(userId: Types.ObjectId): Promise<number> {
    const user = await this.pendingUserModel.findById(userId).exec();
    if (!user) throw new BadRequestException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    return otp;
  }

  async signUp(signUpDto: SignUpDto) {
    const existingUser = await this.pendingUserModel
      .findOne({
        $or: [{ email: signUpDto.email }, { username: signUpDto.username }],
      })
      .exec();

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    const newUser = await this.pendingUserModel.create({
      name: signUpDto.name,
      username: signUpDto.username,
      email: signUpDto.email,
      contactNumber: signUpDto.contactNumber,
      password: hashedPassword,
      role: 'user',
      isVerified: false,
    });

    const accessToken = await this.tokenService.generateAccessToken(
      newUser._id,
    );
    const refreshToken = await this.tokenService.generateRefreshToken(
      newUser._id,
    );

    newUser.refreshToken = refreshToken;
    await newUser.save();

    // Generate OTP and store in user document
    const otp = await this.generateAndStoreOtp(newUser._id);

    // Send OTP via email
    await this.mailService.sendOtpEmail(newUser.email, otp, 'verification');

    const { password, ...userWithoutPassword } = newUser.toObject();
    return {
      message: 'User created successfully',
      data: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async sendUserVerificationOtp(userId: Types.ObjectId) {
    const otp = await this.generateAndStoreOtp(userId);

    const user = await this.pendingUserModel.findById(userId).exec();
    if (!user) throw new BadRequestException('User not found');

    // Send OTP via email
    await this.mailService.sendOtpEmail(user.email, otp, 'verification');

    return {
      message: 'OTP sent successfully',
      otpSentTo: user.email,
    };
  }

  async userVerifiedUsingOtp(userId: mongoose.Types.ObjectId, otp: number) {
    const pendingUser = await this.pendingUserModel.findById(userId).exec();
    if (!pendingUser) throw new BadRequestException('Pending user not found');

    if (pendingUser.otp !== otp) throw new BadRequestException('Invalid OTP');

    if (pendingUser.otpExpiresAt && pendingUser.otpExpiresAt < new Date())
      throw new BadRequestException('OTP expired');

    const wallet = await this.walletModel.create({
      userId: pendingUser._id,
      balance: 0,
      transactions: [],
    });

    const userData: any = {
      _id: pendingUser._id,
      name: pendingUser.name,
      username: pendingUser.username,
      email: pendingUser.email,
      contactNumber: pendingUser.contactNumber,
      password: pendingUser.password,
      role: pendingUser.role,
      refreshToken: pendingUser.refreshToken,
      walletId: wallet._id,
      isVerified: true,
    };

    const newUser = await this.userModel.create(userData);
    await this.pendingUserModel.findByIdAndDelete(userId).exec();

    const { password, ...userWithoutPassword } = newUser.toObject();
    return {
      message: 'User verified successfully',
      data: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    if (!username || !password) {
      throw new NotAcceptableException('Please enter email and password');
    }

    const user = await this.userModel.findOne({ username: username });
    if (!user) throw new NotAcceptableException('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new NotAcceptableException('Invalid password');

    const accessToken = await this.tokenService.generateAccessToken(user._id);
    const refreshToken = await this.tokenService.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();

    return {
      message: 'User login successfully',
      data: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: mongoose.Types.ObjectId) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new UnauthorizedException('User not found');

    user.refreshToken = '';
    await user.save();

    return {
      message: 'user logout',
    };
  }

  async requestForgotPasswordOtp(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new BadRequestException('User not found');

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    user.otpType = 'forgot-password';
    await user.save();

    // Send OTP via email
    await this.mailService.sendOtpEmail(user.email, otp, 'forgot-password');

    return {
      message: 'OTP sent for password reset',
      otpSentTo: user.email,
    };
  }
  async resetPasswordWithOtp(email: string, otp: number, newPassword: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new BadRequestException('User not found');

    if (user.otp !== otp) throw new BadRequestException('Invalid OTP');
    if (user.otpExpiresAt && user.otpExpiresAt < new Date())
      throw new BadRequestException('OTP expired');
    if (user.otpType !== 'forgot-password')
      throw new ConflictException('OTP type mismatch');

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear OTP fields
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpType = 'none';

    await user.save();

    return {
      message: 'Password reset successfully',
    };
  }
}
