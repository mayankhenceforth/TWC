import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
  UseGuards,
  Param,
  Patch,
  Request,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthGuards } from 'src/guards/auth.guards';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/decorator/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuards } from 'src/guards/role.guards';
import { CreatePlanDto } from 'src/plan/dto/create.plan.dto';
import { UpdatePlanDto } from 'src/plan/dto/update.plan.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  // Wallet Checkout Session
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

  // Wallet Payment Intent
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

  // Stripe Webhook
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

  // Create Stripe Plan
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(AuthGuards, RoleGuards)
  @Post('create_stripe_plan')
  async createPlan(@Body() createPlanDto: CreatePlanDto, @Req() req) {
    const userId = req.user._id;
    return this.transactionService.createPlan(createPlanDto, userId);
  }

  // Update Stripe Plan
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(AuthGuards, RoleGuards)
  @Patch('update_stripe_plan/:planId')
  async updatePlan(
    @Param('planId') planId: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @Req() req,
  ) {
    const userId = req.user._id;
    return this.transactionService.updatePlan(
      new Types.ObjectId(planId),
      updatePlanDto,
      userId,
    );
  }

  // Create Subscription for User
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(AuthGuards, RoleGuards)
  @Post('create_subscription')
  async createSubscription(
    @Body() body: { planId: string; userId: string },
  ) {
    return this.transactionService.createSubscription(
      new Types.ObjectId(body.planId),
      new Types.ObjectId(body.userId),
    );
  }

  // Upgrade Subscription
  @ApiBearerAuth()
  @UseGuards(AuthGuards)
  @Patch('upgrade_subscription')
  async upgradeSubscription(
    @Query('newPlanId') newPlanId: string,
    @Request() req
  ) {
    const stripeSubscriptionId = req.user.stripeSubscriptionId;
    return this.transactionService.upgradeSubscriptions(
      stripeSubscriptionId,
      newPlanId,
    );
  }

  // Downgrade Subscription
  @ApiBearerAuth()
  @UseGuards(AuthGuards)
  @Patch('downgrade_subscription')
  async downgradeSubscription(
    @Query('newPlanId') newPlanId: string,
    @Request() req
  ) {
    const stripeSubscriptionId = req.user.stripeSubscriptionId;
    return this.transactionService.downgradeSubscriptions(stripeSubscriptionId, newPlanId)
  }

}
