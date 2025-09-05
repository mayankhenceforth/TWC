import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Plan, PlanDocument } from 'src/schema/plan.schema';
import { Subscription, SubscriptionDocument } from 'src/schema/subscription.schema';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class SubscriptionService {

    constructor(private readonly transactionService: TransactionService,
        @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
        @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>
    ) { }


    async createSubscription(planId: Types.ObjectId, userId: Types.ObjectId) {
        console.log("subscription----------------->")
        const response = await this.transactionService.createSubscription(planId, userId)
        return response
    }

    async upgradeSubscriptions(subscriptionId: string, newStripePlanId: string) {
        console.log("upgrade subscription----------------->")
        const response = await this.transactionService.upgradeSubscriptions(subscriptionId, newStripePlanId)
        return response
    }

    async downgradeSubscriptions(subscriptionId: string, newStripePlanId: string) {
        console.log("Downgrade subscription --------------->")
        const response = await this.transactionService.downgradeSubscriptions(subscriptionId, newStripePlanId)

        return response
    }

}
