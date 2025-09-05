import { Controller, Post, Param, Query, UseGuards, Req, Patch, Request } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Types } from 'mongoose';
import { ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AuthGuards } from 'src/guards/auth.guards';
import { Roles } from 'src/decorator/role.decorator';
import { RoleGuards } from 'src/guards/role.guards';
import { Role } from 'src/enums/role.enum';

@ApiBearerAuth()
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post(':planId/create')
  @Roles(Role.User, Role.Admin, Role.SuperAdmin)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiParam({ name: 'planId', type: String, description: 'Plan ID (MongoDB ObjectId)' })
  async createSubscription(
    @Param('planId') planId: string,
    @Req() req
  ) {
    const userId = req.user._id;
    return this.subscriptionService.createSubscription(
      new Types.ObjectId(planId),
      userId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuards)
  @Patch('upgrade_subscription')
  async upgradeSubscription(
    @Query('newPlanId') newPlanId: string,
    @Request() req
  ) {
    const stripeSubscriptionId = req.user.stripeSubscriptionId;
    return this.subscriptionService.upgradeSubscriptions(
      stripeSubscriptionId,
      newPlanId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuards)
  @Patch('downgrade_subscription')
  async downgradeSubscription(
    @Query('newPlanId') newPlanId:string,
    @Request() req
  ){
    const stripeSubscriptionId = req.user.stripeSubscriptionId;
    return this.subscriptionService.downgradeSubscriptions(stripeSubscriptionId ,newPlanId)
  }
}
