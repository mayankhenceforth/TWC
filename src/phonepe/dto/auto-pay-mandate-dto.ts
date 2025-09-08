// src/phonepe/dto/auto-pay-mandate-dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AutoPayMandateDto {
  @ApiProperty({ example: 1000, description: 'Mandate amount in INR' })
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1 INR' })
  amount: number;

  @ApiProperty({ example: 'DRIVER_123', description: 'Unique user ID' })
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @ApiProperty({ example: 'WEEKLY', description: 'Recurring frequency' })
  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @ApiProperty({ example: '2025-09-10', description: 'Mandate start date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @ApiProperty({ example: '2026-09-10', description: 'Mandate end date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;

  @ApiProperty({ example: 'driver123@upi', description: 'Recipient UPI ID' })
  @IsString()
  @IsNotEmpty({ message: 'UPI ID is required' })
  recipientUpiId: string;

  @ApiProperty({ example: 'John Doe', description: 'Recipient name' })
  @IsString()
  @IsNotEmpty({ message: 'Recipient name is required' })
  recipientName: string;

  @ApiPropertyOptional({ example: 'DRIVER_WEEKLY_PAYOUT', description: 'Purpose of the mandate' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ example: 'Weekly payout for rides', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'mandate_123456', description: 'Unique transaction ID for mandate' })
  @IsOptional()
  @IsString()
  merchantTransactionId?: string;

  @ApiPropertyOptional({ example: 'https://yourdomain.com/payment/mandate-callback', description: 'Callback URL' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;
}