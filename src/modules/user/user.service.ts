import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Payout, PayoutDocument, User, UserDocument } from 'src/comman/Schema/user.schema';

@Injectable()
export class UserService {

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Payout.name) private payoutModel: Model<PayoutDocument>,
        // private tokenService: TokenService,
        // private smsService: SmsService,
        // private mailService: MailService
    ) { }


    

}
