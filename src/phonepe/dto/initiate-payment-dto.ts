
import { IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, IsUrl, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({ example: 100, description: 'Payment amount in INR' })
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1 INR' })
  amount: number;

  @ApiProperty({ example: 'user_123', description: 'Unique user ID' })
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @ApiPropertyOptional({ example: 'txn_1725798492000', description: 'Unique transaction ID (optional, generated if not sent)' })
  @IsString()
  @IsOptional()
  merchantTransactionId?: string;

  @ApiPropertyOptional({ example: 'https://yourdomain.com/payment/callback', description: 'Callback URL' })
  @IsUrl()
  @IsOptional()
  callbackUrl?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Contact number of the user' })
  @IsPhoneNumber('IN')
  @IsOptional()
  contactNumber?: string;
}