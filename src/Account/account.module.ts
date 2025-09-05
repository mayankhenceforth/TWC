import { Module } from '@nestjs/common';
import { PayoutService } from './account.service';
import { PayoutController } from './account.controller';

@Module({
  providers: [PayoutService],
  controllers: [PayoutController],
  exports:[PayoutService]
})
export class AccountModule {}
