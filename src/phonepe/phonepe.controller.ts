// src/phonepe/phonepe.controller.ts
import { Controller, Post, Body, Get, Param, Headers } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InitiatePaymentDto } from './dto/initiate-payment-dto';
import { PayoutRequestDto } from './dto/payout-request-dto';
import { AutoPayMandateDto } from './dto/auto-pay-mandate-dto';
import { PhonePeService } from './phonepe.service';

@Controller('payment')
export class PhonePeController {
  private readonly logger = new Logger(PhonePeController.name);

  constructor(private readonly phonepeService: PhonePeService) {}

  @Post('initiate')
  async initiate(@Body() body: InitiatePaymentDto) {
    this.logger.log('Initiating payment');
    return this.phonepeService.initiatePayment(body);
  }

  @Post('callback')
  async handlePaymentCallback(@Body() body: any, @Headers() headers: any) {
    this.logger.log('Payment callback received');
    return this.phonepeService.processCallback({ body, headers });
  }

  @Get('status/:transactionId')
  async getPaymentStatus(@Param('transactionId') transactionId: string) {
    this.logger.log(`Checking payment status for transaction: ${transactionId}`);
    return this.phonepeService.verifyPayment(transactionId);
  }

  @Post('payout/driver/upi')
  async payoutToDriverUpi(@Body() body: PayoutRequestDto) {
    this.logger.log('Initiating driver UPI payout');
    return this.phonepeService.payToDriverUpi(body);
  }

  @Post('payout/driver/bank')
  async payoutToDriverBank(@Body() body: PayoutRequestDto) {
    this.logger.log('Initiating driver bank payout');
    return this.phonepeService.payToDriverBank(body);
  }

  @Get('payout/status/:transactionId')
  async getPayoutStatus(@Param('transactionId') transactionId: string) {
    this.logger.log(`Checking payout status for transaction: ${transactionId}`);
    return this.phonepeService.checkDriverPayoutStatus(transactionId);
  }

  @Post('payout/driver/bulk')
  async bulkPayoutToDrivers(@Body() body: { payouts: PayoutRequestDto[] }) {
    this.logger.log(`Processing bulk payout for ${body.payouts.length} drivers`);

    const results: {
      success: boolean;
      recipient: string;
      transactionId?: string;
      data?: any;
      error?: string;
    }[] = [];

    for (const [index, payout] of body.payouts.entries()) {
      try {
        this.logger.log(`Processing payout ${index + 1}/${body.payouts.length} for ${payout.recipientName}`);

        let result;
        if (payout.recipientUpiId) {
          result = await this.phonepeService.payToDriverUpi(payout);
        } else if (payout.recipientAccountNumber && payout.recipientIfscCode) {
          result = await this.phonepeService.payToDriverBank(payout);
        } else {
          throw new Error('Invalid payout details - need either UPI ID or Bank Account details');
        }

        results.push({
          success: true,
          recipient: payout.recipientName,
          transactionId: result.merchantTransactionId,
          data: result,
        });
      } catch (error: any) {
        this.logger.error(`Failed payout to ${payout.recipientName}: ${error.message}`);
        results.push({
          success: false,
          recipient: payout.recipientName,
          error: error.message,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return {
      total: body.payouts.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  @Post('create-mandate')
  async createMandate(@Body() mandateDto: AutoPayMandateDto) {
    this.logger.log('Initiating AutoPay mandate');
    return this.phonepeService.createAutoPayMandate(mandateDto);
  }

  @Post('mandate-callback')
  async handleMandateCallback(@Body() body: any, @Headers() headers: any) {
    this.logger.log('Mandate callback received');
    return this.phonepeService.processMandateCallback({ body, headers });
  }

  @Get('mandate/status/:transactionId')
  async getMandateStatus(@Param('transactionId') transactionId: string) {
    this.logger.log(`Checking mandate status for transaction: ${transactionId}`);
    return this.phonepeService.checkMandateStatus(transactionId);
  }

  @Post('mandate/revoke')
  async revokeMandate(@Body() body: { mandateId: string }) {
    this.logger.log(`Revoking mandate: ${body.mandateId}`);
    return this.phonepeService.revokeAutoPayMandate(body.mandateId);
  }
}