import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User, UserDocument } from 'src/schema/user.schema';
import { CreatePayoutDto } from './dto/create.payout.dto';
import { Account, AccountDocument } from 'src/schema/account.schema';


@Injectable()
export class PayoutService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  // Add new payout
  async addPayout(userId: mongoose.Types.ObjectId, payoutDto: CreatePayoutDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const newPayout = await this.accountModel.create({
      userId,
      country: payoutDto.country,
      accountNumber: payoutDto.accountNumber,
      routingNumber: payoutDto.routingNumber,
    });

    user.payoutIds.push(newPayout._id);
    await user.save();

    return { message: 'Payout added successfully', payout: newPayout };
  }

  // Edit payout
  async editPayout(userId: mongoose.Types.ObjectId, payoutId: string, payoutDto: CreatePayoutDto) {
    const payout = await this.accountModel.findById(payoutId);
    if (!payout || !payout.userId.equals(userId)) throw new NotFoundException('Payout not found');

    payout.country = payoutDto.country;
    payout.accountNumber = payoutDto.accountNumber;
    payout.routingNumber = payoutDto.routingNumber;

    await payout.save();
    return { message: 'Payout updated successfully', payout };
  }

  // Delete payout
  async deletePayout(userId: mongoose.Types.ObjectId, payoutId: string) {
    const payout = await this.accountModel.findById(payoutId);
    if (!payout || !payout.userId.equals(userId)) throw new NotFoundException('Payout not found');

    await this.accountModel.findByIdAndDelete(payoutId);

    // Remove payoutId from user's payoutIds array
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { payoutIds: payout._id },
    });

    return { message: 'Payout deleted successfully' };
  }

  // Get all payouts of a user
  async getUserPayouts(userId: mongoose.Types.ObjectId) {
    const payouts = await this.accountModel.find({ userId });
    return { message: 'User payouts fetched', payouts };
  }

  // Get specific payout
  async getPayout(userId: mongoose.Types.ObjectId, payoutId: string) {
    const payout = await this.accountModel.findById(payoutId);
    if (!payout || !payout.userId.equals(userId)) throw new NotFoundException('Payout not found');
    return { message: 'Payout fetched', payout };
  }
}
