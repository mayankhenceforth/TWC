import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthGuards } from 'src/guards/auth.guards';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/decorator/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuards } from 'src/guards/role.guards';
import { CreatePlanDto } from 'src/plan/dto/create.plan.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Post('checkout_session')
  async createCheckout(
    @Body()
    body: {
      successUrl: string;
      cancelUrl: string;
      amount: number;
      userId: string;
    },
  ) {
    return this.transactionService.createCheckoutSession(
      body.successUrl,
      body.cancelUrl,
      body.amount,
      new Types.ObjectId(body.userId),
    );
  }

  @Post('checkout_payment_intent')
  async createPayment_intent(
    @Body()
    body: {
      amount: number;
      userId: string;
    },
  ) {
    return this.transactionService.createPaymentIntent(
      body.amount,
      new Types.ObjectId(body.userId),
    );
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') sig: string,
  ) {
    try {
      const rawBody = (req as any).body as Buffer;
      await this.transactionService.handleWebhook(rawBody, sig);
      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook error:', err?.message);
      res.status(400).send(`Webhook Error: ${err?.message}`);
    }
  }
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(AuthGuards, RoleGuards)
  @Post('create_stripe_plan')
  async createPlan(
    @Body() createPlanDto: CreatePlanDto, @Req() req
  ) {
     const userId = req.user._id
    return this.transactionService.createPlan(createPlanDto,userId)
  }
}
