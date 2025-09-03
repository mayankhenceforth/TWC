import { Controller } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet, WalletDocument } from 'src/schema/wallet.schema';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from 'src/schema/transaction.schema';

@Controller('transaction')
export class TransactionController {

    constructor(private readonly transactionService: TransactionService,
        @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
        @InjectModel(Transaction.name) private readonly teansactionModel: Model<TransactionDocument>
    ) { }

    



}
