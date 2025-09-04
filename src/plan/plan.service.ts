import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { CreatePlanDto } from './dto/create.plan.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuards } from 'src/guards/auth.guards';
import { Roles } from 'src/decorator/role.decorator';
import { Role } from 'src/enums/role.enum';
import mongoose, { Model } from 'mongoose';
import { TransactionService } from 'src/transaction/transaction.service';
import { UpdatePlanDto } from './dto/update.plan.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Plan, PlanDocument } from 'src/schema/plan.schema';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class PlanService {

    constructor(private readonly transactionService: TransactionService,
        @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>
    ) { }

    async getAllPlan(){
        const allPlan = await this.planModel.find({isActive:true}).select('-createdBy -__v')
        return allPlan
    }

    async createPlan(createPlanDto: CreatePlanDto, userId: mongoose.Types.ObjectId) {
        const response = await this.transactionService.createPlan(createPlanDto, userId)
        return response
    }

    async updatePlan(planId: mongoose.Types.ObjectId, updatePlanDto: UpdatePlanDto, userId: mongoose.Types.ObjectId) {
        const response = await this.transactionService.updatePlan(planId, updatePlanDto, userId)
        return response
    }
}
