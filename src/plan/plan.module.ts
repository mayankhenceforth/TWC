import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Module({
  controllers: [PlanController],
  providers: [PlanService,TransactionService]
})
export class PlanModule {}
