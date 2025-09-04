import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreditDto {
  @ApiProperty({
    example: 100,
    description: 'Amount to be credited to the user wallet',
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiPropertyOptional({
    example: 'Refund for order #1234',
    description: 'Optional description for the credit transaction',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
