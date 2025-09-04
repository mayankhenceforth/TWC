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


    async createSubscription(planId:Types.ObjectId , userId :Types.ObjectId){
        console.log("subscription----------------->")
        console.log(planId ,userId)
        const response = await this.transactionService.createSubscription(planId, userId)
        return response
    }

}
