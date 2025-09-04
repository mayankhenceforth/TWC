import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService,TransactionService]
})
export class SubscriptionModule {}
