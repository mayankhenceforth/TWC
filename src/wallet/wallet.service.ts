import { BadRequestException, Injectable } from '@nestjs/common';
import { CreditDto } from './dto/creadit.dto';
import mongoose, { Model } from 'mongoose';
import { TransactionService } from 'src/transaction/transaction.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class WalletService {
  constructor(private readonly trasactionService: TransactionService,
    @InjectModel(User.name) private readonly userModel:Model<UserDocument>
  ) {}

  async credit(creditDto: CreditDto, userId: mongoose.Types.ObjectId) {
    const successUrl = `${process.env.FRONTEND_URL}/success`;
    const cancelUrl = `${process.env.FRONTEND_URL}/cancel`;
    const { amount, description } = creditDto;
    const user = await this.userModel.findById(userId)
    if(!user?.walletId){
        throw new BadRequestException("user Wallet not found")
    }

    console.log(creditDto, userId);

    // const session = await this.trasactionService.createCheckoutSession(
    //   successUrl,
    //   cancelUrl,
    //   amount,
    //   userId
    // );
    // return session
    const payment_intent = await this.trasactionService.createPaymentIntent(amount,userId)
    return payment_intent
  }
}
