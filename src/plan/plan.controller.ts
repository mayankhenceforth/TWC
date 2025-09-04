import { Body, Controller, Post, UseGuards, Req, Patch, Query, Get } from '@nestjs/common';
import { CreatePlanDto } from './dto/create.plan.dto';
import { PlanService } from './plan.service';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/decorator/role.decorator';
import { Role } from 'src/enums/role.enum';
import { AuthGuards } from 'src/guards/auth.guards';
import { RoleGuards } from 'src/guards/role.guards';
import { UpdatePlanDto } from './dto/update.plan.dto';
import { Types } from 'mongoose';


@Controller('plan')
export class PlanController {
    constructor(private readonly planService: PlanService) { }

    @Get('')
    async getPlan(){
        return this.planService.getAllPlan()
    }

    @ApiBearerAuth()
    @Roles(Role.Admin, Role.SuperAdmin)
    @UseGuards(AuthGuards, RoleGuards)
    @Post('create')
    async createPlan(@Body() createPlanDto: CreatePlanDto, @Req() req) {
        const userId = req.user._id
        return this.planService.createPlan(createPlanDto, userId);
    }

    
    @ApiBearerAuth()
    @ApiQuery({
        name: 'planId',
        type: String,
        description: 'Plan ID (MongoDB ObjectId)'
    })
    @Roles(Role.Admin, Role.SuperAdmin)
    @UseGuards(AuthGuards, RoleGuards)
    @Patch('update')
    async updatePlan(
        @Body() updatePlanDto: UpdatePlanDto,
        @Req() req,
        @Query('planId') planId: string,
    ) {
        const userId = req.user._id;
        return this.planService.updatePlan(new Types.ObjectId(planId), updatePlanDto, userId);
    }



}
