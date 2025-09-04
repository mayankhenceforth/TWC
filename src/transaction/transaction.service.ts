import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlanDurationUnit } from 'src/enums/plan.enum';
import { SubscriptionStatus } from 'src/enums/subscription.enum';
import {
  TransactionMethod,
  TransactionStatus,
} from 'src/enums/transaction.enum';
import { CreatePlanDto } from 'src/plan/dto/create.plan.dto';
import { UpdatePlanDto } from 'src/plan/dto/update.plan.dto';
import { Plan, PlanDocument } from 'src/schema/plan.schema';
import { Subscription, SubscriptionDocument } from 'src/schema/subscription.schema';
import {
  Transaction,
  TransactionDocument,
} from 'src/schema/transaction.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import { Wallet, WalletDocument } from 'src/schema/wallet.schema';
import Stripe from 'stripe';

@Injectable()
export class TransactionService {
  private stripe: Stripe;
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>

  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      {},
    );
  }

  async createCheckoutSession(
    successUrl: string,
    cancelUrl: string,
    totalAmount: number,
    userId: Types.ObjectId,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new Error('User not found');

    const walletId = user.walletId;
    if (!walletId) throw new Error('User wallet not found');

    const amountInCents = Math.round(totalAmount * 100);

    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'inr',
            unit_amount: amountInCents,
            product_data: { name: 'Wallet Top-up' },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        walletId: walletId.toString(),
        userId: userId.toString(),
      },
    });

    const transaction = await this.transactionModel.create({
      userId,
      walletId,
      amount: totalAmount,
      currency: 'INR',
      status: TransactionStatus.PENDING,
      checkoutSessionId: session.id,
      transactionId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : undefined,
      transactionMethod: TransactionMethod.CARD,
    });

    await this.walletModel.findByIdAndUpdate(walletId, {
      $push: { transactions: transaction._id },
    });

    return session.url;
  }

  async createPaymentIntent(totalAmount: number, userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const walletId = user.walletId;
    if (!walletId) throw new BadRequestException('User wallet not found');

    const amountInCents = Math.round(totalAmount * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
      metadata: {
        walletId: walletId.toString(),
        userId: userId.toString(),
      },
    });

    const transaction = await this.transactionModel.create({
      userId,
      walletId,
      amount: totalAmount,
      currency: 'INR',
      status: TransactionStatus.PENDING,
      transactionId: paymentIntent.id,
      transactionMethod: paymentIntent.payment_method_types[0] as TransactionMethod,
    });

    await this.walletModel.findByIdAndUpdate(walletId, {
      $push: { transactions: transaction._id },
    });

    return { clientSecret: paymentIntent.client_secret, totalAmount };
  }


  async handleWebhook(rawBody: Buffer, sig: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        this.configService.get<string>('STRIPE_WEBHOOK_ENDPOINT_SECRET')!,
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err?.message);
      throw new BadRequestException(`Webhook error: ${err?.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          const fullSession = await this.stripe.checkout.sessions.retrieve(
            session.id,
            { expand: ['payment_intent'] },
          );

          const walletId = fullSession.metadata?.walletId;
          const paymentIntent = fullSession.payment_intent as Stripe.PaymentIntent | null;

          if (!walletId) break;

          const transaction = await this.transactionModel.findOneAndUpdate(
            { checkoutSessionId: session.id },
            {
              status: TransactionStatus.SUCCESS,
              transactionId: paymentIntent?.id ?? undefined,
            },
            { new: true },
          );

          if (transaction) {
            await this.walletModel.findByIdAndUpdate(walletId, {
              $inc: { amount: transaction.amount },
              $push: { transations: transaction._id },
              lastTransactionAmount: transaction.amount,
              lastTransactionId: transaction._id,
            });
          }

          break;
        }
        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;

          await this.transactionModel.findOneAndUpdate(
            { transactionId: pi.id },
            { status: TransactionStatus.FAILED },
          );
          break;
        }
        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent;
          const walletId = pi.metadata?.walletId;

          if (!walletId) break;

          const transaction = await this.transactionModel.findOneAndUpdate(
            { transactionId: pi.id },
            { status: TransactionStatus.SUCCESS },
            { new: true },
          );

          if (transaction) {
            await this.walletModel.findByIdAndUpdate(walletId, {
              $inc: { amount: transaction.amount },
              $push: { transactions: transaction._id },
              lastTransactionAmount: transaction.amount,
              lastTransactionId: transaction._id,
            });
          }

          break;
        }
        default:
          break;
      }

      return { received: true };
    } catch (error: any) {
      console.error('Webhook handling error:', error?.message);
      throw new BadRequestException(`Webhook error: ${error?.message}`);
    }
  }

  async createPlan(createPlanDto: CreatePlanDto, userId: Types.ObjectId) {
    const { name, price, currency, duration, durationUnit, features } = createPlanDto;



    const intervalCount = Math.max(1, duration);

    const product = await this.stripe.products.create({ name });

    const plan = await this.stripe.plans.create({
      amount: Math.round(price * 100),
      currency: currency.toLowerCase(),
      interval: durationUnit,
      interval_count: intervalCount,
      product: product.id,
      nickname: name,
    });

    console.log("plan--------------->", plan)

    const planDocument = new this.planModel({
      createdBy: userId,
      name,
      price,
      currency: plan.currency,
      duration,
      durationUnit,
      features,
      stripePlanId: plan.id,
      stripeProductId: product.id,
      isActive: true,
    });

    return planDocument.save();
  }

  async updatePlan(planId: Types.ObjectId, updatePlanDto: UpdatePlanDto, userId: Types.ObjectId) {
    const plan = await this.planModel.findById(planId)
    if (!plan) {
      throw new NotFoundException("Plan Not Found")
    }
    console.log(plan.createdBy)
    console.log(userId)
    if (plan.createdBy.toString() !== userId.toString()) {
      throw new NotFoundException("You are not able to edit the plan");
    }


    if (updatePlanDto.name) {
      await this.stripe.products.update(plan.stripeProductId, {
        name: updatePlanDto.name,
      });
    }

    let newStripePlanId: string | undefined;

    if (updatePlanDto.price && updatePlanDto.currency) {

      const intervalCount = Math.max(1, updatePlanDto.duration || plan.duration);

      const newStripePlan = await this.stripe.plans.create({
        amount: Math.round(updatePlanDto.price * 100),
        currency: updatePlanDto.currency.toLowerCase(),
        interval: updatePlanDto.durationUnit || plan.durationUnit,
        interval_count: intervalCount,
        product: plan.stripeProductId,
        nickname: updatePlanDto.name || plan.name,
      });

      newStripePlanId = newStripePlan.id;

    }

    const updatedPlan = await this.planModel.findByIdAndUpdate(
      planId,
      {
        $set: {
          ...(updatePlanDto.name && { name: updatePlanDto.name }),
          ...(updatePlanDto.price && { price: updatePlanDto.price }),
          ...(updatePlanDto.currency && { currency: updatePlanDto.currency }),
          ...(updatePlanDto.duration && { duration: updatePlanDto.duration }),
          ...(updatePlanDto.durationUnit && { durationUnit: updatePlanDto.durationUnit }),
          ...(updatePlanDto.features && { features: updatePlanDto.features }),
          ...(newStripePlanId && { stripePlanId: newStripePlanId }),
        },
      },
      { new: true },
    );

  }



  async createSubscription(planId: Types.ObjectId, userId: Types.ObjectId) {
    console.log("transaction --------------->")
    // console.log(planId, userId)
    const plan = await this.planModel.findById(planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
      });

      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    const subscription = await this.stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ plan: plan.stripePlanId }],
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // console.log("subscription details:", subscription)
    const startDate = new Date(subscription.start_date * 1000);
    let durationInMs: number;

    switch (plan.durationUnit) {
      case PlanDurationUnit.DAY:
        durationInMs = plan.duration * 24 * 60 * 60 * 1000;
        break;
      case PlanDurationUnit.WEEK:
        durationInMs = plan.duration * 7 * 24 * 60 * 60 * 1000;
        break;
      case PlanDurationUnit.MONTH:
        durationInMs = plan.duration * 30 * 24 * 60 * 60 * 1000;
        break;
      case PlanDurationUnit.YEAR:
        durationInMs = plan.duration * 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        durationInMs = 0;
    }
    const endDate = new Date(startDate.getTime() + durationInMs);

    const subscriptionDoc = await this.subscriptionModel.create({
      userId,
      planId,
      stripeSubscriptionId: subscription.id,
      status: SubscriptionStatus.INCOMPLETE,
      startDate: startDate,
      endDate: endDate,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
    });

    return subscriptionDoc;
  }


  // async upgradeSubscriptions(subsId: string, stripe_plan_id: string) {
  //   try {
  //     const subscription = await this.stripe.subscriptions.retrieve(subsId);
  //     let data_to_upadte = {
  //       cancel_at_period_end: false,
  //       trial_end: "now",
  //       payment_behavior: 'default_incomplete',
  //       proration_behavior: 'always_invoice',
  //       items: [
  //         {
  //           id: subscription.items.data[0].id,
  //           plan: stripe_plan_id,
  //         },
  //       ],
  //       expand: ['latest_invoice.payment_intent']
  //     };
  //     const updatedSubscription = await this.stripe.subscriptions.update(subsId, data_to_upadte);
  //     return updatedSubscription;
  //   } catch (error) {
  //     throw error
  //   }
  // }





}
