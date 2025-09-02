import { Controller, Post, Put, Delete, Get, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuards } from 'src/comman/Guards/auth.guards';
import { CreatePayoutDto } from './dto/create.payout.dto';
import { PayoutService } from './payout.service';
import { Request } from 'express';
import * as mongoose from 'mongoose';

@ApiTags('Payouts')
@Controller('payout')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuards)
  @Post('add')
  @ApiOperation({ summary: 'Add a new payout account for the authenticated user' })
  async addPayout(@Req() request: Request, @Body() payoutDto: CreatePayoutDto) {
    const user = (request as any).user;
    if (!user) throw new BadRequestException('User not authenticated');

    return this.payoutService.addPayout(new mongoose.Types.ObjectId(user._id), payoutDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuards)
  @Put('edit/:payoutId')
  @ApiOperation({ summary: 'Edit a payout account' })
  async editPayout(@Req() request: Request, @Param('payoutId') payoutId: string, @Body() payoutDto: CreatePayoutDto) {
    const user = (request as any).user;
    return this.payoutService.editPayout(new mongoose.Types.ObjectId(user._id), payoutId, payoutDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuards)
  @Delete('delete/:payoutId')
  @ApiOperation({ summary: 'Delete a payout account' })
  async deletePayout(@Req() request: Request, @Param('payoutId') payoutId: string) {
    const user = (request as any).user;
    return this.payoutService.deletePayout(new mongoose.Types.ObjectId(user._id), payoutId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuards)
  @Get()
  @ApiOperation({ summary: 'Get all payout accounts of authenticated user' })
  async getUserPayouts(@Req() request: Request) {
    const user = (request as any).user;
    return this.payoutService.getUserPayouts(new mongoose.Types.ObjectId(user._id));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuards)
  @Get(':payoutId')
  @ApiOperation({ summary: 'Get a specific payout account of authenticated user' })
  async getPayout(@Req() request: Request, @Param('payoutId') payoutId: string) {
    const user = (request as any).user;
    return this.payoutService.getPayout(new mongoose.Types.ObjectId(user._id), payoutId);
  }
}
