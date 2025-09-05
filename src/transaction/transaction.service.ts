import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlanDurationUnit } from 'src/enums/plan.enum';
import { SubscriptionStatus } from 'src/enums/subscription.enum';
import {
  TransactionMethod,
  TransactionStatus,
  TransactionType,
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
              $push: { transactions: transaction._id },
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

        case 'invoice.created': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`Invoice created: ${invoice.id} for customer ${invoice.customer} ${invoice.parent?.subscription_details?.metadata?.subscriptionDocId}`);

          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionDocumentId = invoice.parent?.subscription_details?.metadata?.subscriptionDocId

          await this.subscriptionModel.findByIdAndUpdate(subscriptionDocumentId, {
            startDate: new Date(invoice.period_start * 1000),
            endDate: new Date(invoice.period_end * 1000),
            status: SubscriptionStatus.ACTIVE,
          })
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionDocumentId = invoice.parent?.subscription_details?.metadata?.subscriptionDocId

          await this.subscriptionModel.findByIdAndUpdate(subscriptionDocumentId, {
            startDate: new Date(invoice.period_start * 1000),
            endDate: new Date(invoice.period_end * 1000),
            currentPeriodEnd: new Date(invoice.period_end * 1000),
            currentPeriodStart: new Date(invoice.period_start * 1000),
          })
          break;
        }

        case 'invoice.payment_action_required': {
          const invoice = event.data.object as Stripe.Invoice;
          const stripeSubscriptionId = (invoice as any).subscription as string | undefined;

          if (stripeSubscriptionId) {
            await this.subscriptionModel.findOneAndUpdate(
              { stripeSubscriptionId },
              { $set: { status: SubscriptionStatus.INCOMPLETE } },
            );
          }
          break;
        }

        default:
          break;
      }

      return { received: true };
    } catch (error: any) {
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
    if (!Types.ObjectId.isValid(planId) || !Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid plan or user ID');
    }

    const [plan, user] = await Promise.all([
      this.planModel.findById(planId),
      this.userModel.findById(userId),
    ]);

    if (!plan) throw new NotFoundException('Plan not found');
    if (!user) throw new NotFoundException('User not found');
    if (user.stripeSubscriptionId) throw new BadRequestException(
      'You are not able to buy a new subscription. Please upgrade your existing subscription.'
    );
    if (!plan.stripePlanId) throw new NotFoundException('Plan is missing Stripe plan ID');
    const startDate = new Date();
    const subscriptionDoc = new this.subscriptionModel({
      userId,
      planId,
      stripeSubscriptionId: null,
      status: SubscriptionStatus.INCOMPLETE,
      startDate,
      endDate: new Date(startDate.getTime() + (plan.duration || 30) * 24 * 60 * 60 * 1000),
      currentPeriodStart: startDate,
      currentPeriodEnd: new Date(startDate.getTime() + (plan.duration || 30) * 24 * 60 * 60 * 1000),
    });
    await subscriptionDoc.save();

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      try {
        const customer = await this.stripe.customers.create({
          email: user.email || undefined,
          name: user.name || undefined,
          metadata: { userId: userId.toString(), subscriptionDocId: subscriptionDoc._id.toString() },
        });

        stripeCustomerId = customer.id;
        user.stripeCustomerId = stripeCustomerId;

        await user.save();
      } catch (error: any) {
        throw new Error(`Failed to create Stripe customer: ${error.message}`);
      }
    }

    let subscription: Stripe.Subscription;
    try {
      subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ plan: plan.stripePlanId }],
        payment_settings: { save_default_payment_method: 'on_subscription' },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { subscriptionDocId: subscriptionDoc._id.toString() },
      });

    } catch (error: any) {
      throw new Error(`Failed to create Stripe subscription: ${error.message}`);
    }

    subscriptionDoc.stripeSubscriptionId = subscription.id;
    subscriptionDoc.status = subscription.status as SubscriptionStatus;
    subscriptionDoc.startDate = startDate;
    subscriptionDoc.currentPeriodStart = startDate;
    subscriptionDoc.currentPeriodEnd = subscriptionDoc.endDate
    await subscriptionDoc.save();

    user.stripeSubscriptionId = subscription.id

    await user.save()

    const transaction = await this.transactionModel.create({
      userId: userId,
      amount: plan.price,
      currency: plan.currency || 'usd',
      status: TransactionStatus.PENDING, 
      transactionMethod: TransactionMethod.CARD, 
      type: TransactionType.SUBSCRIPTION_CREATE,
      stripeSubscriptionId: subscription.id,
      newPlanId: planId,
      description: `Subscription purchase: ${plan.name}`
    });

    if (user.walletId) {
      await this.walletModel.findByIdAndUpdate(user.walletId, {
        $push: { transactions: transaction._id },
      });
    }


    return {
      subscription: subscriptionDoc,
      paymentIntent: subscription.latest_invoice
        ? (subscription.latest_invoice as any).payment_intent
        : null,
    };
  }



  async upgradeSubscriptions(subscriptionId: string, newStripePlanId: string) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      if (!subscription || !subscription.items.data.length) {
        throw new Error('Subscription not found or has no items');
      }

      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
        proration_behavior: 'always_invoice',
        items: [
          {
            id: subscription.items.data[0].id,
            plan: newStripePlanId,
          },
        ],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      console.log(' Subscription upgraded successfully:', updatedSubscription.id);
      return updatedSubscription;
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      throw new BadRequestException(`Failed to upgrade subscription: ${error.message}`);
    }
  }

  async downgradeSubscriptions(subscriptionId: string, newStripePlanId: string) {

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      if (!subscription || !subscription.items.data.length) {
        throw new Error('Subscription not found or has no items');
      }

      // let data = {
      //   cancel_at_period_end: false,
      //   trial_end: "now",
      //   payment_behavior: 'default_incomplete',
      //   proration_behavior: 'none',
      //   items: [
      //     {
      //       id: subscription.items.data[0].id,
      //       plan: newStripePlanId,
      //     },
      //   ]
      // };
      // await this.stripe.subscriptions.update(subscriptionId, data);

      await this.stripe.subscriptions.update(subscriptionId,
        {
          cancel_at_period_end: false,
          trial_end: "now",
          payment_behavior: 'default_incomplete',
          proration_behavior: 'none',
          items: [
            {
              id: subscription.items.data[0].id,
              plan: newStripePlanId,
            },
          ]
        }
      )

    } catch (error) {
      console.error('Failed to downgrade subscription:', error);
      throw new BadRequestException(`Failed to downgrade subscription: ${error.message}`);
    }
  }



}
