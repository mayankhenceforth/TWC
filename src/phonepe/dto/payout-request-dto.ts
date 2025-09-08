// src/phonepe/dto/payout-request-dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PayoutRequestDto {
  @ApiProperty({
    example: 5000,
    description: 'Amount in INR (must be at least 1)',
  })
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1 INR' })
  amount: number;

  @ApiPropertyOptional({
    example: 'user@upi',
    description: 'Recipient UPI ID (required if payout is via UPI)',
  })
  @IsOptional()
  @IsString()
  recipientUpiId?: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Recipient bank account number (required if payout is via bank transfer)',
  })
  @IsOptional()
  @IsString()
  recipientAccountNumber?: string;

  @ApiPropertyOptional({
    example: 'HDFC0001234',
    description: 'IFSC code (required if payout is via bank transfer)',
  })
  @IsOptional()
  @IsString()
  recipientIfscCode?: string;

  @ApiProperty({
    example: 'Ramesh Kumar',
    description: 'Name of the recipient',
  })
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @ApiProperty({
    example: 'Vendor Payment',
    description: 'Purpose of the payout',
  })
  @IsNotEmpty()
  @IsString()
  purpose: string;

  @ApiPropertyOptional({
    example: 'Payment for invoice #1234',
    description: 'Additional notes (optional)',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}