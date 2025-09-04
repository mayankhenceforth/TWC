import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuards } from 'src/guards/auth.guards';
import { WalletService } from './wallet.service';
import { CreditDto } from './dto/creadit.dto';

@ApiBearerAuth()
@UseGuards(AuthGuards)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}
  @Post('credit')
  credit(@Body() creditDto: CreditDto, @Request() req) {
    const userId = req.user._id;
    return this.walletService.credit(creditDto, userId);
  }
}
